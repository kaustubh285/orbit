import { and, eq, gte, lt, or } from "drizzle-orm";
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
	const { type, status, priority, date } = c.req.valid("query");
	c.var.logger.info("{ type, status, priority, date }")
	c.var.logger.info(JSON.stringify({ type, status, priority, date, message: "dataishere" }))
	const conditions = [eq(questsTable.userId, userId)];
	if (type) conditions.push(eq(questsTable.type, type));
	if (status) conditions.push(eq(questsTable.status, status));
	if (priority) conditions.push(eq(questsTable.priority, priority));
	if (date) {
		const dayStart = new Date(`${date}T00:00:00.000Z`)
		const dayEnd = new Date(`${date}T23:59:59.999Z`)
		conditions.push(
			or(
				and(gte(questsTable.dueAt, dayStart), lt(questsTable.dueAt, dayEnd)),
				and(gte(questsTable.startAt, dayStart), lt(questsTable.startAt, dayEnd)),
			)!,
		)
	}

	const quests = await db.select().from(questsTable).where(and(...conditions));
	return c.json(quests, HttpStatusCodes.OK);
};

function toDate(val: string | null | undefined): Date | null | undefined {
	if (val === undefined) return undefined;
	if (val === null) return null;
	return new Date(val);
}

export const createQuest: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { dueAt, completedAt, startAt, endAt, lastCompletedAt, ...rest } = c.req.valid("json");

	const [quest] = await db
		.insert(questsTable)
		.values({
			...rest,
			userId,
			dueAt: toDate(dueAt),
			completedAt: toDate(completedAt),
			startAt: toDate(startAt),
			endAt: toDate(endAt),
			lastCompletedAt: toDate(lastCompletedAt),
		})
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
	const { dueAt, completedAt, startAt, endAt, lastCompletedAt, ...rest } = c.req.valid("json");

	const [updated] = await db
		.update(questsTable)
		.set({
			...rest,
			dueAt: toDate(dueAt),
			completedAt: toDate(completedAt),
			startAt: toDate(startAt),
			endAt: toDate(endAt),
			lastCompletedAt: toDate(lastCompletedAt),
		})
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
