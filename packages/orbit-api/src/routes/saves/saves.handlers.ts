import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { detectPlatform, scrapeUrl } from "./scraper/index.js";
import type {
	CreateRoute,
	GetOneRoute,
	ListRoute,
	RemoveRoute,
	UpdateRoute,
} from "./routes.js";

function toDate(val: string | null | undefined): Date | null | undefined {
	if (val === undefined) return undefined;
	if (val === null) return null;
	return new Date(val);
}

export const listSaves: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const { platform, status } = c.req.valid("query");

	const conditions = [eq(savesTable.userId, userId)];
	if (platform) conditions.push(eq(savesTable.sourcePlatform, platform));
	if (status) conditions.push(eq(savesTable.status, status));

	const saves = await db.select().from(savesTable).where(and(...conditions));
	return c.json(saves, HttpStatusCodes.OK);
};

export const createSave: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { publishedAt, ...rest } = c.req.valid("json");

	const [save] = await db
		.insert(savesTable)
		.values({
			sourcePlatform: detectPlatform(rest.sourceUrl),
			...rest,
			userId,
			...(publishedAt !== undefined ? { publishedAt: toDate(publishedAt) } : {}),
		})
		.returning();

	const logger = c.var.logger;
	scrapeUrl(rest.sourceUrl)
		.then((scraped) =>
			db
				.update(savesTable)
				.set({
					sourcePlatform: scraped.sourcePlatform,
					title: scraped.title ?? save.title,
					description: scraped.description ?? save.description,
					thumbnailUrl: scraped.thumbnailUrl ?? save.thumbnailUrl,
					author: scraped.author ?? save.author,
					publishedAt: scraped.publishedAt ?? save.publishedAt,
				})
				.where(eq(savesTable.id, save.id)),
		)
		.catch((err) => {
			logger.warn({ err, saveId: save.id }, "background scrape failed");
		});

	return c.json(save, HttpStatusCodes.CREATED);
};

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
	const { publishedAt, ...rest } = c.req.valid("json");

	const [updated] = await db
		.update(savesTable)
		.set({ ...rest, publishedAt: toDate(publishedAt) })
		.where(and(eq(savesTable.id, id), eq(savesTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);
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
