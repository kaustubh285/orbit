import { and, desc, eq, getTableColumns, lt, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import { listItemsTable, listsTable } from "../../db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { detectPlatform, scrapeUrl, type ScrapeResult } from "./scraper/index.js";
import { toDate } from "@/lib/utils.js";
import type {
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
	const { publishedAt, listId, ...rest } = c.req.valid("json");
	const logger = c.var.logger;

	const [save] = await db
		.insert(savesTable)
		.values({
			sourcePlatform: detectPlatform(rest.sourceUrl),
			...rest,
			tags: rest.tags ?? undefined,
			userId,
			...(publishedAt !== undefined ? { publishedAt: toDate(publishedAt) } : {}),
		})
		.returning();

	if (listId) {
		await db
			.insert(listItemsTable)
			.values({ listId, saveId: save.id, questId: null })
			.onConflictDoNothing();
	}

	// fire-and-forget: scrape then enrich
	enrichSave(save.id, rest.sourceUrl, userId, logger, rest.shouldAISummaries, listId ?? null, rest.note ?? null);

	return c.json(save, HttpStatusCodes.CREATED);
};

async function enrichSave(
	saveId: string,
	sourceUrl: string,
	userId: string,
	logger: any,
	shouldAISummaries: boolean = true,
	listId: string | null = null,
	note: string | null = null,
) {
	try {
		// step 1: scrape
		const scraped = await scrapeUrl(sourceUrl);

		const updatedSave = await db
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
			.where(eq(savesTable.id, saveId)).returning();

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
		const selectedList = listId ? (userLists.find((l) => l.id === listId) ?? null) : null;

		// step 3: AI enrichment
		const ai = await aiOverview({
			title: scraped.title || "",
			description: scraped.description || "",
			note,
			tags: existingTags,
			lists: listNames,
			selectedList: selectedList ? { name: selectedList.name, description: selectedList.description } : null,
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
					aiSummary: ai.summary,
					tags: mergedTags,
					locationName: ai.location?.name ?? null,
					locationLat: null, // geocode later if needed
					locationLng: null,
					aiEnrichedAt: new Date(),
				})
				.where(eq(savesTable.id, saveId));

			// Assign to a list if user didn't already pick one and AI suggested one
			if (!listId && ai.list) {
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
