import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { questsTable } from "../../db/schemas/quests.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
	CreateRoute,
	GetOneRoute,
	ListRoute,
	RemoveRoute,
	UpdateRoute,
} from "./routes.js";

export const listQuests: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const { type, status, priority } = c.req.valid("query");

	const conditions = [eq(questsTable.userId, userId)];
	if (type) conditions.push(eq(questsTable.type, type));
	if (status) conditions.push(eq(questsTable.status, status));
	if (priority) conditions.push(eq(questsTable.priority, priority));

	const quests = await db.select().from(questsTable).where(and(...conditions));
	return c.json(quests, HttpStatusCodes.OK);
};

export const createQuest: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const body = c.req.valid("json");

	const [quest] = await db
		.insert(questsTable)
		.values({ ...body, userId })
		.returning();

	return c.json(quest, HttpStatusCodes.CREATED);
};

export const getOneQuest: AppRouteHandler<GetOneRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [quest] = await db
		.select()
		.from(questsTable)
		.where(and(eq(questsTable.id, id), eq(questsTable.userId, userId)));

	if (!quest) {
		return c.json({ message: "Quest not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.json(quest, HttpStatusCodes.OK);
};

export const updateQuest: AppRouteHandler<UpdateRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");

	const [updated] = await db
		.update(questsTable)
		.set(body)
		.where(and(eq(questsTable.id, id), eq(questsTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "Quest not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.json(updated, HttpStatusCodes.OK);
};

export const removeQuest: AppRouteHandler<RemoveRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [archived] = await db
		.update(questsTable)
		.set({ status: "archived" })
		.where(and(eq(questsTable.id, id), eq(questsTable.userId, userId)))
		.returning();

	if (!archived) {
		return c.json({ message: "Quest not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.body(null, HttpStatusCodes.NO_CONTENT);
};
