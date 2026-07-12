import { and, desc, eq, gte, lt, lte, or, ne, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { questsTable, questTypeEnum } from "../../db/schemas/quests.schema.js";
import { listItemsTable } from "../../db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { toDate } from "@/lib/utils.js";
import type {
	CountRoute,
	TimelineRoute,
	CreateRoute,
	GetOneRoute,
	ListRoute,
	RemoveRoute,
	UpdateRoute,
} from "./routes.js";
import { parseQuest } from "@/lib/parse-quest.js";

export const countQuests: AppRouteHandler<CountRoute> = async (c) => {
	const userId = c.var.userId;
	const { start, end } = c.req.valid("query");

	const rangeStart = new Date(`${start}T00:00:00.000Z`);
	const rangeEnd = new Date(`${end}T23:59:59.999Z`);

	const dateExpr = sql`date_trunc('day', COALESCE(${questsTable.dueAt}, ${questsTable.startAt}))`;

	const result = await db
		.select({
			date: sql<string>`${dateExpr}::date::text`,
			count: sql<number>`count(DISTINCT ${questsTable.type})::int`,
			types: sql<(typeof questTypeEnum.enumValues[number])[]>`COALESCE(json_agg(DISTINCT ${questsTable.type}) FILTER (WHERE ${questsTable.type} IS NOT NULL), '[]'::json)`,
		})
		.from(questsTable)
		.where(
			and(
				eq(questsTable.userId, userId),
				ne(questsTable.status, "archived"),
				or(
					and(gte(questsTable.dueAt, rangeStart), lt(questsTable.dueAt, rangeEnd)),
					and(gte(questsTable.startAt, rangeStart), lt(questsTable.startAt, rangeEnd)),
				)!,
			),
		)
		.groupBy(dateExpr);

	return c.json(result, HttpStatusCodes.OK);
};

export const timelineQuests: AppRouteHandler<TimelineRoute> = async (c) => {
	const userId = c.var.userId;
	const { before, limit } = c.req.valid("query");

	const conditions = [
		eq(questsTable.userId, userId),
		eq(questsTable.isRemembral, true),
		ne(questsTable.status, "archived"),
	];

	if (before) {
		conditions.push(lte(questsTable.startAt, new Date(before)));
	}

	const quests = await db
		.select()
		.from(questsTable)
		.where(and(...conditions))
		.orderBy(desc(questsTable.startAt))
		.limit(limit);

	return c.json(quests, HttpStatusCodes.OK);
};

export const listQuests: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const { type, status, priority, date, limit, cursor } = c.req.valid("query");
	const conditions = [eq(questsTable.userId, userId)];
	if (type) conditions.push(eq(questsTable.type, type));
	if (status) conditions.push(eq(questsTable.status, status));
	if (priority) conditions.push(eq(questsTable.priority, priority));
	if (date) {
		const dayStart = new Date(`${date}T00:00:00.000Z`);
		const dayEnd = new Date(`${date}T23:59:59.999Z`);
		conditions.push(
			or(
				and(gte(questsTable.dueAt, dayStart), lt(questsTable.dueAt, dayEnd)),
				and(gte(questsTable.startAt, dayStart), lt(questsTable.startAt, dayEnd)),
			)!,
		);
	}
	if (cursor) conditions.push(lt(questsTable.createdAt, new Date(cursor)));

	const quests = await db
		.select()
		.from(questsTable)
		.where(and(...conditions))
		.orderBy(desc(questsTable.createdAt))
		.limit(limit);

	return c.json(quests, HttpStatusCodes.OK);
};

export const createQuest: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { dueAt, completedAt, startAt, endAt, lastCompletedAt, listId, isRemembral, emoji, ...rest } = c.req.valid("json");

	let resolvedLastCompletedAt = toDate(lastCompletedAt);


	const [previousQuest] = await db
		.select()
		.from(questsTable)
		.where(
			and(
				eq(questsTable.userId, userId),
				// eq(questsTable.type, rest.type),
				eq(questsTable.title, rest.title),
				eq(questsTable.status, "completed"),
			),
		)
		.orderBy(desc(questsTable.completedAt))
		.limit(1);

	if (previousQuest) {
		resolvedLastCompletedAt = previousQuest.completedAt ?? previousQuest.lastCompletedAt ?? previousQuest.updatedAt;
	}

	const [quest] = await db
		.insert(questsTable)
		.values({
			...rest,
			userId,
			dueAt: toDate(dueAt),
			completedAt: toDate(completedAt),
			startAt: toDate(startAt),
			endAt: toDate(endAt),
			lastCompletedAt: resolvedLastCompletedAt,
			isRemembral: isRemembral ?? false,
			emoji: emoji ?? null,
		})
		.returning();

	if (listId) {
		await db.insert(listItemsTable)
			.values({ listId, questId: quest.id, saveId: null })
			.onConflictDoNothing();
	}

	if (quest.type === "todo") {
		const timezone = c.req.header("x-timezone") ?? "UTC"
		await parseQuest({ title: quest.title, body: quest.body, id: quest.id, timezone })
	}

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
	const { dueAt, completedAt, startAt, endAt, lastCompletedAt, listId, isRemembral, emoji, ...rest } = c.req.valid("json");

	const resolvedCompletedAt = rest.status === "completed" && completedAt === undefined
		? new Date()
		: toDate(completedAt);

	const [updated] = await db
		.update(questsTable)
		.set({
			...rest,
			dueAt: toDate(dueAt),
			completedAt: resolvedCompletedAt,
			startAt: toDate(startAt),
			endAt: toDate(endAt),
			lastCompletedAt: toDate(lastCompletedAt),
			...(isRemembral !== undefined ? { isRemembral } : {}),
			...(emoji !== undefined ? { emoji } : {}),
		})
		.where(and(eq(questsTable.id, id), eq(questsTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "Quest not found" }, HttpStatusCodes.NOT_FOUND);
	}

	if (listId) {
		await db.insert(listItemsTable)
			.values({ listId, questId: updated.id, saveId: null })
			.onConflictDoNothing();
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
