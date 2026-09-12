import { and, desc, eq, gte, inArray, lt, lte, or, ne, sql } from "drizzle-orm";
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

function sortWithChildren<T extends { id: string; parentId: string | null }>(quests: T[]): T[] {
	const childrenByParent = new Map<string, T[]>();
	const topLevel: T[] = [];

	for (const q of quests) {
		if (q.parentId) {
			const bucket = childrenByParent.get(q.parentId) ?? [];
			bucket.push(q);
			childrenByParent.set(q.parentId, bucket);
		} else {
			topLevel.push(q);
		}
	}

	const result: T[] = [];
	const placedParentIds = new Set(topLevel.map((q) => q.id));

	for (const q of topLevel) {
		result.push(q);
		result.push(...(childrenByParent.get(q.id) ?? []));
	}

	// Orphaned children whose parent wasn't in the result set
	for (const [parentId, children] of childrenByParent) {
		if (!placedParentIds.has(parentId)) result.push(...children);
	}

	return result;
}

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

	// When filtering by date, child quests have no dueAt so they won't match the
	// date condition. Fetch them separately so they appear alongside their parent.
	let combined = [...quests];
	if (date && quests.length > 0) {
		const parentIds = quests.filter((q) => !q.parentId).map((q) => q.id);
		if (parentIds.length > 0) {
			const childConditions = [
				eq(questsTable.userId, userId),
				inArray(questsTable.parentId, parentIds),
			];
			if (status) childConditions.push(eq(questsTable.status, status));

			const children = await db
				.select()
				.from(questsTable)
				.where(and(...childConditions))
				.orderBy(questsTable.createdAt);

			const existingIds = new Set(quests.map((q) => q.id));
			combined = [...quests, ...children.filter((c) => !existingIds.has(c.id))];
		}
	}

	return c.json(sortWithChildren(combined), HttpStatusCodes.OK);
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

	if (quest.type !== "note") {
		const timezone = c.req.header("x-timezone") ?? "UTC"
		parseQuest({ title: quest.title, body: quest.body, id: quest.id, timezone, userId }).catch((err) =>
			console.error("[parseQuest] background error:", err),
		);
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

	// Completing a parent quest completes all its children too
	if (rest.status === "completed" && updated.parentId === null) {
		await db.update(questsTable)
			.set({ status: "completed", completedAt: resolvedCompletedAt ?? new Date() })
			.where(and(
				eq(questsTable.userId, userId),
				eq(questsTable.parentId, updated.id),
				ne(questsTable.status, "completed"),
			));
	}

	if (updated.type !== "note" && (rest.title !== undefined || rest.body !== undefined)) {
		const timezone = c.req.header("x-timezone") ?? "UTC"
		parseQuest({ title: updated.title, body: updated.body, id: updated.id, timezone, userId }).catch((err) =>
			console.error("[parseQuest] background error:", err),
		);
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
