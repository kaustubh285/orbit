import { and, desc, eq, getTableColumns, inArray, isNull, lt, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import { listItemsTable, listsTable } from "../../db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { detectPlatform, scrapeUrl, type ScrapeResult } from "./scraper/index.js";
import { toDate } from "@/lib/utils.js";
import type {
	BackfillRoute,
	CreateRoute,
	GetOneRoute,
	ListRoute,
	RemoveRoute,
	UpdateRoute,
} from "./routes.js";
import { aiOverview } from "@/lib/ai-overviews.js";

export const listSaves: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const { platform, status, tag, limit, cursor } = c.req.valid("query");

	const conditions = [eq(savesTable.userId, userId)];
	if (platform) conditions.push(eq(savesTable.sourcePlatform, platform));
	if (status) conditions.push(eq(savesTable.status, status));
	if (tag) conditions.push(sql`${tag} = ANY(${savesTable.tags})`);
	if (cursor) conditions.push(lt(savesTable.createdAt, new Date(cursor)));

	const saves = await db
		.select({
			...getTableColumns(savesTable),
			lists: sql<string[]>`ARRAY_REMOVE(ARRAY_AGG(${listsTable.name}), NULL)`,
		})
		.from(savesTable)
		.leftJoin(listItemsTable, eq(listItemsTable.saveId, savesTable.id))
		.leftJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
		.where(and(...conditions))
		.groupBy(savesTable.id)
		.orderBy(desc(savesTable.createdAt))
		.limit(limit);

	return c.json(saves, HttpStatusCodes.OK);
};

export const createSave: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { publishedAt, ...rest } = c.req.valid("json");
	const logger = c.var.logger;

	const { listIds, ...insertRest } = rest;

	const [save] = await db
		.insert(savesTable)
		.values({
			sourcePlatform: detectPlatform(insertRest.sourceUrl),
			...insertRest,
			tags: insertRest.tags ?? undefined,
			userId,
			...(publishedAt !== undefined ? { publishedAt: toDate(publishedAt) } : {}),
		})
		.returning();

	if (listIds?.length) {
		await db
			.insert(listItemsTable)
			.values(listIds.map((listId) => ({ listId, saveId: save.id, questId: null })))
			.onConflictDoNothing();
	}

	// fire-and-forget: scrape then enrich
	enrichSave(save.id, insertRest.sourceUrl, userId, logger, insertRest.shouldAISummaries, listIds ?? [], insertRest.note ?? null);

	return c.json(save, HttpStatusCodes.CREATED);
};

async function enrichSave(
	saveId: string,
	sourceUrl: string,
	userId: string,
	logger: any,
	shouldAISummaries: boolean = true,
	listIds: string[] = [],
	note: string | null = null,
) {
	try {
		// step 1: scrape
		const scraped = await scrapeUrl(sourceUrl);

		await db
			.update(savesTable)
			.set({
				sourcePlatform: scraped.sourcePlatform,
				title: scraped.title,
				description: scraped.description,
				thumbnailUrl: scraped.thumbnailUrl,
				author: scraped.author,
				publishedAt: scraped.publishedAt,
				tags: scraped.tags,
			})
			.where(eq(savesTable.id, saveId));

		if (!shouldAISummaries) return;

		// step 2: get existing tags + lists for AI context
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

		// step 3: AI enrichment
		const ai = await aiOverview({
			title: scraped.title || "",
			description: scraped.description || "",
			author: scraped.author,
			note,
			tags: existingTags,
			lists: listNames,
			selectedLists,
		});

		if (ai) {
			const [current] = await db
				.select({ tags: savesTable.tags })
				.from(savesTable)
				.where(eq(savesTable.id, saveId));

			const mergedTags = [...new Set([...(current?.tags ?? []), ...ai.tags])];

			await db
				.update(savesTable)
				.set({
					aiTitle: ai.ai_title,
					aiSummary: JSON.stringify(ai),
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
	const { publishedAt, listId, ...rest } = c.req.valid("json");

	const [updated] = await db
		.update(savesTable)
		.set({ ...rest, publishedAt: toDate(publishedAt) })
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
	}

	if (listId) {
		await db.insert(listItemsTable)
			.values({ listId, saveId: updated.id, questId: null })
			.onConflictDoNothing();
	}

	if (updated.shouldAISummaries) {
		enrichSave(updated.id, updated.sourceUrl, userId, c.var.logger, true, [], updated.note);
	}

	return c.json(updated, HttpStatusCodes.OK);
};

export const removeSave: AppRouteHandler<RemoveRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [archived] = await db
		.update(savesTable)
		.set({ status: "archived" })
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)))
		.returning();

	if (!archived) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.body(null, HttpStatusCodes.NO_CONTENT);
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

	type Detail = { id: string; platform: string; status: "updated" | "failed" | "skipped"; error?: string };
	const details: Detail[] = [];

	for (let i = 0; i < saves.length; i += BACKFILL_BATCH) {
		const batch = saves.slice(i, i + BACKFILL_BATCH);

		for (const save of batch) {
			try {
				if (!save.title && !save.description) {
					details.push({ id: save.id, platform: save.sourcePlatform, status: "skipped", error: "no title or description" });
					continue;
				}

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
					details.push({ id: save.id, platform: save.sourcePlatform, status: "failed", error: "AI returned null" });
					continue;
				}

				const mergedTags = [...new Set([...save.tags, ...ai.tags])];

				await db.update(savesTable)
					.set({
						aiTitle: ai.ai_title,
						aiSummary: JSON.stringify(ai),
						tags: mergedTags,
						locationName: ai.location?.name ?? null,
						aiEnrichedAt: new Date(),
					})
					.where(eq(savesTable.id, save.id));

				details.push({ id: save.id, platform: save.sourcePlatform, status: "updated" });
			} catch (err) {
				details.push({ id: save.id, platform: save.sourcePlatform, status: "failed", error: String(err) });
			}
		}

		if (i + BACKFILL_BATCH < saves.length) {
			await new Promise((r) => setTimeout(r, BACKFILL_DELAY_MS));
		}
	}

	return c.json({
		updated: details.filter((d) => d.status === "updated").length,
		failed: details.filter((d) => d.status === "failed").length,
		skipped: details.filter((d) => d.status === "skipped").length,
		details,
	}, HttpStatusCodes.OK);
};
