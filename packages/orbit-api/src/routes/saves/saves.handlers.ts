import { and, desc, eq, getTableColumns, ilike, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import { listItemsTable, listsTable } from "../../db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { detectPlatform, scrapeUrl, type ScrapeResult } from "./scraper/index.js";
import { toDate } from "@/lib/utils.js";
import { normalizeUrl } from "@/lib/normalize-url.js";
import type {
	BackfillRoute,
	CreateRoute,
	GetOneRoute,
	ListRoute,
	RemoveRoute,
	ResurfaceSavesRoute,
	UpdateRoute,
	UpdateSaveListRoute,
} from "./routes.js";
import { aiOverview, type AiModel } from "@/lib/ai-overviews.js";
import { usersTable } from "@/db/schema";
import { resurfaceLogic } from "@/lib/resurface.js";

export const listSaves: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const { platform, status, tag, limit, cursor, q } = c.req.valid("query");

	const conditions = [eq(savesTable.userId, userId), isNull(savesTable.deletedAt)];
	if (platform) conditions.push(eq(savesTable.sourcePlatform, platform));
	if (status) conditions.push(eq(savesTable.status, status));
	if (tag) conditions.push(sql`${tag} = ANY(${savesTable.tags})`);
	if (cursor) conditions.push(lt(savesTable.createdAt, new Date(cursor)));
	if (q) {
		const like = `%${q}%`;
		conditions.push(or(
			ilike(savesTable.title, like),
			ilike(savesTable.aiTitle, like),
			ilike(savesTable.description, like),
			ilike(savesTable.note, like),
			ilike(savesTable.aiSummary, like),
			sql`array_to_string(${savesTable.tags}, ' ') ILIKE ${like}`,
		)!);
	}

	const saves = await db
		.select({
			...getTableColumns(savesTable),
			lists: sql<string[]>`ARRAY_REMOVE(ARRAY_AGG(${listsTable.name}), NULL)`,
		})
		.from(savesTable)
		.leftJoin(listItemsTable, and(eq(listItemsTable.saveId, savesTable.id), isNull(listItemsTable.deletedAt)))
		.leftJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
		.where(and(...conditions))
		.groupBy(savesTable.id)
		.orderBy(desc(savesTable.createdAt))
		.limit(limit);

	return c.json(saves, HttpStatusCodes.OK);
};

function isUniqueViolation(err: unknown): boolean {
	for (let e = err; e instanceof Error; e = e.cause) {
		if ((e as { code?: string }).code === "23505") return true;
	}
	return false;
}

export const createSave: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { publishedAt, ...rest } = c.req.valid("json");
	const logger = c.var.logger;

	const { listIds, ...insertRest } = rest;

	const normalizedUrl = normalizeUrl(insertRest.sourceUrl);

	const findExisting = () =>
		db
			.select()
			.from(savesTable)
			.where(and(
				eq(savesTable.userId, userId),
				eq(savesTable.normalizedUrl, normalizedUrl),
				isNull(savesTable.deletedAt),
			))
			.limit(1);

	// Dupe check — resurface instead of silently dropping
	const [existing] = await findExisting();

	if (existing) {
		return c.json(
			{ duplicate: true as const, previouslySavedAt: existing.createdAt.toISOString(), save: existing },
			HttpStatusCodes.OK,
		);
	}

	let save: typeof savesTable.$inferSelect;
	try {
		[save] = await db
			.insert(savesTable)
			.values({
				sourcePlatform: detectPlatform(insertRest.sourceUrl),
				...insertRest,
				normalizedUrl,
				tags: insertRest.tags ?? undefined,
				userId,
				...(publishedAt !== undefined ? { publishedAt: toDate(publishedAt) } : {}),
			})
			.returning();
	} catch (err) {
		// concurrent request (e.g. Shortcut double-fire) won the race on the
		// (userId, normalizedUrl) partial unique index
		if (isUniqueViolation(err)) {
			const [raced] = await findExisting();
			if (raced) {
				return c.json(
					{ duplicate: true as const, previouslySavedAt: raced.createdAt.toISOString(), save: raced },
					HttpStatusCodes.OK,
				);
			}
		}
		throw err;
	}

	if (listIds?.length) {
		await db
			.insert(listItemsTable)
			.values(listIds.map((listId) => ({ listId, saveId: save.id, questId: null })))
			.onConflictDoNothing();
	}

	// fire-and-forget: scrape then enrich
	enrichSave(save.id, insertRest.sourceUrl, userId, logger, insertRest.shouldAISummaries, listIds ?? [], insertRest.note ?? null, "new_save");

	return c.json(save, HttpStatusCodes.CREATED);
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

async function enrichSave(
	saveId: string,
	sourceUrl: string,
	userId: string,
	logger: any,
	shouldAISummaries: boolean = true,
	listIds: string[] = [],
	note: string | null = null,
	reason: "new_save" | "update_content_changed" = "new_save",
) {
	try {
		// step 1: scrape
		const scraped = await scrapeUrl(sourceUrl);

		// Only overwrite DB fields the scraper actually returned — never clobber
		// user-provided content with null (Instagram and other blocked platforms
		// return empty, which would wipe the title/description the user submitted).
		await db
			.update(savesTable)
			.set({
				sourcePlatform: scraped.sourcePlatform,
				...(scraped.title != null && { title: scraped.title }),
				...(scraped.description != null && { description: scraped.description }),
				...(scraped.thumbnailUrl != null && { thumbnailUrl: scraped.thumbnailUrl }),
				...(scraped.author != null && { author: scraped.author }),
				...(scraped.publishedAt != null && { publishedAt: scraped.publishedAt }),
				tags: scraped.tags,
			})
			.where(eq(savesTable.id, saveId));

		if (!shouldAISummaries) return;

		// step 2: cooldown check — skip AI if enriched within the last 10 minutes.
		// Also read back title/description/author so AI can use user-provided content
		// when the scraper returned nothing (e.g. Instagram).
		const [current] = await db
			.select({
				aiEnrichedAt: savesTable.aiEnrichedAt,
				tags: savesTable.tags,
				title: savesTable.title,
				description: savesTable.description,
				author: savesTable.author,
			})
			.from(savesTable)
			.where(eq(savesTable.id, saveId));

		if (current?.aiEnrichedAt && Date.now() - current.aiEnrichedAt.getTime() < TEN_MINUTES_MS) {
			console.log(`[ai] skip saveId=${saveId} reason=cooldown enriched_at=${current.aiEnrichedAt.toISOString()}`);
			return;
		}

		// step 3: get existing tags + lists for AI context
		const allSaves = await db
			.select({ tags: savesTable.tags })
			.from(savesTable)
			.where(eq(savesTable.userId, userId));

		const existingTags = [...new Set(allSaves.flatMap((s) => s.tags))];

		const userLists = await db
			.select({ id: listsTable.id, name: listsTable.name, description: listsTable.description })
			.from(listsTable)
			.where(eq(listsTable.userId, userId));

		const listNames = userLists.map((l) => l.name);
		const selectedLists = listIds.length
			? userLists.filter((l) => listIds.includes(l.id)).map((l) => ({ name: l.name, description: l.description }))
			: [];

		// step 4: fetch user's AI model preference
		const [userRow] = await db
			.select({ aiModel: usersTable.aiModel })
			.from(usersTable)
			.where(eq(usersTable.id, userId));
		const aiModel = (userRow?.aiModel ?? "sarvam") as AiModel;

		// step 5: AI enrichment — prefer scraped data, fall back to DB content
		// so that user-provided titles/descriptions are used when scraping fails.
		console.log(`[ai] call saveId=${saveId} model=${aiModel} reason=${reason}`);
		const ai = await aiOverview({
			title: scraped.title || current?.title || "",
			description: scraped.description || current?.description || "",
			author: scraped.author || current?.author,
			note,
			tags: existingTags,
			lists: listNames,
			selectedLists,
			model: aiModel,
		});

		if (!ai) {
			logger.warn({ saveId }, "[ai] enrichment returned null — skipping DB update");
			return;
		}
		if (ai) {
			const { ai_title, tags: aiTags, list: _list, ...summaryData } = ai;
			const mergedTags = [...new Set([...(current?.tags ?? []), ...aiTags])];

			await db
				.update(savesTable)
				.set({
					aiTitle: ai_title,
					aiSummary: JSON.stringify(summaryData),
					tags: mergedTags,
					locationName: ai.location?.name ?? null,
					aiEnrichedAt: new Date(),
				})
				.where(eq(savesTable.id, saveId));

			// Assign to a list if user didn't already pick one and AI suggested one
			if (!listIds.length && ai.list) {
				const match = userLists.find(
					(l) => l.name.toLowerCase() === ai.list.toLowerCase()
				);

				let targetListId: string;
				if (match) {
					targetListId = match.id;
				} else {
					const [newList] = await db
						.insert(listsTable)
						.values({ userId, name: ai.list })
						.returning({ id: listsTable.id });
					targetListId = newList.id;
				}

				await db
					.insert(listItemsTable)
					.values({ listId: targetListId, saveId, questId: null })
					.onConflictDoNothing();
			}
		}
	} catch (err) {
		logger.warn({ err, saveId }, "enrich pipeline failed");
	}
}

export const getOneSave: AppRouteHandler<GetOneRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [save] = await db
		.select()
		.from(savesTable)
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)));

	if (!save) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.json(save, HttpStatusCodes.OK);
};

export const updateSave: AppRouteHandler<UpdateRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");
	const { publishedAt, listIds, ...rest } = c.req.valid("json");

	// Pre-fetch to detect which enrichment-relevant fields actually changed
	const [existing] = await db
		.select({ title: savesTable.title, description: savesTable.description, note: savesTable.note, sourceUrl: savesTable.sourceUrl })
		.from(savesTable)
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)));

	const [updated] = await db
		.update(savesTable)
		.set({ ...rest, publishedAt: toDate(publishedAt) })
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
	}

	if (listIds) {
		await updateSaveList(listIds, updated.id, userId);
	}

	const enrichmentFieldChanged =
		(rest.title !== undefined && rest.title !== existing?.title) ||
		(rest.description !== undefined && rest.description !== existing?.description) ||
		(rest.note !== undefined && rest.note !== existing?.note) ||
		(rest.sourceUrl !== undefined && rest.sourceUrl !== existing?.sourceUrl);

	if (updated.shouldAISummaries && enrichmentFieldChanged) {
		enrichSave(updated.id, updated.sourceUrl, userId, c.var.logger, true, [], updated.note, "update_content_changed");
	}

	return c.json(updated, HttpStatusCodes.OK);
};

export const updateSaveList = async (listIds: string[], id: string, userId: string) => {
	console.log(`[updateSaveList] start saveId=${id} requestedLists=${JSON.stringify(listIds)}`);

	const [saveBelongsToUser] = await db
		.select()
		.from(savesTable)
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)));

	if (!saveBelongsToUser) {
		console.log(`[updateSaveList] abort: save not found or not owned saveId=${id} userId=${userId}`);
		return;
	}

	const existingListItems = await db
		.select()
		.from(listItemsTable)
		.where(and(eq(listItemsTable.saveId, id), isNull(listItemsTable.deletedAt)));

	console.log(`[updateSaveList] existingLists=${JSON.stringify(existingListItems.map((i) => i.listId))}`);

	await db.transaction(async (tx) => {
		if (!listIds?.length) {
			console.log(`[updateSaveList] clearing all lists for saveId=${id}`);
			await tx
				.update(listItemsTable)
				.set({ deletedAt: new Date() })
				.where(eq(listItemsTable.saveId, id));
		} else {
			const newLists = listIds.filter((listId) => !existingListItems.some((item) => item.listId === listId));
			console.log(`[updateSaveList] toAdd=${JSON.stringify(newLists)}`);
			if (newLists.length > 0) {
				await tx
					.insert(listItemsTable)
					.values(newLists.map((listId) => ({ listId, saveId: id })))
					.onConflictDoUpdate({
						target: [listItemsTable.listId, listItemsTable.saveId],
						targetWhere: isNotNull(listItemsTable.saveId),
						set: { deletedAt: null },
					});
			}
			const removedFromLists = existingListItems.filter((item) => !listIds.includes(item.listId));
			console.log(`[updateSaveList] toRemove=${JSON.stringify(removedFromLists.map((i) => i.listId))}`);
			if (removedFromLists.length > 0) {
				await tx
					.update(listItemsTable)
					.set({ deletedAt: new Date() })
					.where(and(
						eq(listItemsTable.saveId, id),
						inArray(listItemsTable.listId, removedFromLists.map((item) => item.listId)),
					));
			}
		}
	});

	console.log(`[updateSaveList] done saveId=${id}`);
};

export const removeSave: AppRouteHandler<RemoveRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const archived = await db.transaction(async (tx) => {
		const [save] = await tx
			.update(savesTable)
			.set({ deletedAt: new Date() })
			.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)))
			.returning();

		if (!save) return null;

		await tx
			.update(listItemsTable)
			.set({ deletedAt: new Date() })
			.where(eq(listItemsTable.saveId, id));

		return save;
	});

	if (!archived) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const resurfaceSaves: AppRouteHandler<ResurfaceSavesRoute> = async (c) => {
	const userId = c.var.userId;

	const resurfacedSave = await resurfaceLogic({ userId });

	if (!resurfacedSave) {
		return c.body(null, HttpStatusCodes.NO_CONTENT);
	}

	return c.json(resurfacedSave, HttpStatusCodes.OK);
};

// ─── AI enrichment backfill ───────────────────────────────────────────────────
// Re-enriches all saves with the new structured prompt (ai_title + JSON summary).
// Run once after deploying the prompt changes. No re-scrape — uses existing DB data.

const BACKFILL_BATCH = 3;
const BACKFILL_DELAY_MS = 600;

export const backfillSaves: AppRouteHandler<BackfillRoute> = async (c) => {
	const userId = c.var.userId;

	const [saves, userLists] = await Promise.all([
		db.select({
			id: savesTable.id,
			sourcePlatform: savesTable.sourcePlatform,
			title: savesTable.title,
			description: savesTable.description,
			author: savesTable.author,
			note: savesTable.note,
			tags: savesTable.tags,
		}).from(savesTable).where(and(eq(savesTable.userId, userId), isNull(savesTable.aiTitle))),
		db.select({ id: listsTable.id, name: listsTable.name, description: listsTable.description })
			.from(listsTable).where(eq(listsTable.userId, userId)),
	]);

	const existingTags = [...new Set(saves.flatMap((s) => s.tags))];
	const listNames = userLists.map((l) => l.name);

	console.log(`[ai] backfill queued total=${saves.length}`);

	// Fire-and-forget — respond immediately so the HTTP request never times out
	(async () => {
		for (let i = 0; i < saves.length; i += BACKFILL_BATCH) {
			const batch = saves.slice(i, i + BACKFILL_BATCH);

			for (const save of batch) {
				try {
					if (!save.title && !save.description) {
						console.log(`[ai] skip saveId=${save.id} reason=no_content`);
						continue;
					}

					console.log(`[ai] call saveId=${save.id} reason=backfill`);
					const ai = await aiOverview({
						title: save.title || "",
						description: save.description || "",
						author: save.author,
						note: save.note,
						tags: existingTags,
						lists: listNames,
						selectedLists: [],
					});

					if (!ai) {
						console.error(`[ai] null saveId=${save.id} reason=backfill`);
						continue;
					}

					const { ai_title, tags: aiTags, list: _list, ...summaryData } = ai;
					const mergedTags = [...new Set([...save.tags, ...aiTags])];

					await db.update(savesTable)
						.set({
							aiTitle: ai_title,
							aiSummary: JSON.stringify(summaryData),
							tags: mergedTags,
							locationName: ai.location?.name ?? null,
							aiEnrichedAt: new Date(),
						})
						.where(eq(savesTable.id, save.id));

					console.log(`[ai] done saveId=${save.id} reason=backfill`);
				} catch (err) {
					console.error(`[ai] error saveId=${save.id} reason=backfill`, err);
				}
			}

			if (i + BACKFILL_BATCH < saves.length) {
				await new Promise((r) => setTimeout(r, BACKFILL_DELAY_MS));
			}
		}
		console.log(`[ai] backfill complete total=${saves.length}`);
	})();

	return c.json({
		queued: saves.length,
		message: `Backfill started for ${saves.length} saves. Watch logs for [ai] progress.`,
	}, HttpStatusCodes.OK);
};
