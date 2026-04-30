import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { listsTable, listItemsTable } from "../../db/schemas/lists.schema.js";
import { questsTable } from "../../db/schemas/quests.schema.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
	ListRoute,
	CreateRoute,
	GetOneRoute,
	UpdateRoute,
	RemoveRoute,
	AddItemRoute,
	RemoveItemRoute,
} from "./routes.js";

export const listLists: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;
	const lists = await db.select().from(listsTable).where(eq(listsTable.userId, userId));
	return c.json(lists, HttpStatusCodes.OK);
};

export const createList: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const body = c.req.valid("json");

	const [list] = await db.insert(listsTable).values({ ...body, userId }).returning();
	return c.json(list, HttpStatusCodes.CREATED);
};

export const getOneList: AppRouteHandler<GetOneRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [list] = await db
		.select()
		.from(listsTable)
		.where(and(eq(listsTable.id, id), eq(listsTable.userId, userId)));

	if (!list) {
		return c.json({ message: "List not found" }, HttpStatusCodes.NOT_FOUND);
	}

	const items = await db
		.select({
			id: listItemsTable.id,
			listId: listItemsTable.listId,
			questId: listItemsTable.questId,
			saveId: listItemsTable.saveId,
			createdAt: listItemsTable.createdAt,
			quest: questsTable,
			save: savesTable,
		})
		.from(listItemsTable)
		.leftJoin(questsTable, eq(listItemsTable.questId, questsTable.id))
		.leftJoin(savesTable, eq(listItemsTable.saveId, savesTable.id))
		.where(eq(listItemsTable.listId, id));

	return c.json({ ...list, items }, HttpStatusCodes.OK);
};

export const updateList: AppRouteHandler<UpdateRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");

	const [updated] = await db
		.update(listsTable)
		.set(body)
		.where(and(eq(listsTable.id, id), eq(listsTable.userId, userId)))
		.returning();

	if (!updated) {
		return c.json({ message: "List not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.json(updated, HttpStatusCodes.OK);
};

export const removeList: AppRouteHandler<RemoveRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const [deleted] = await db
		.delete(listsTable)
		.where(and(eq(listsTable.id, id), eq(listsTable.userId, userId)))
		.returning();

	if (!deleted) {
		return c.json({ message: "List not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const addListItem: AppRouteHandler<AddItemRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");
	const { questId, saveId } = c.req.valid("json");

	// Verify list belongs to user
	const [list] = await db
		.select()
		.from(listsTable)
		.where(and(eq(listsTable.id, id), eq(listsTable.userId, userId)));

	if (!list) {
		return c.json({ message: "List not found" }, HttpStatusCodes.NOT_FOUND);
	}

	const [item] = await db
		.insert(listItemsTable)
		.values({ listId: id, questId: questId ?? null, saveId: saveId ?? null })
		.returning();

	// Return with joined content
	const [enriched] = await db
		.select({
			id: listItemsTable.id,
			listId: listItemsTable.listId,
			questId: listItemsTable.questId,
			saveId: listItemsTable.saveId,
			createdAt: listItemsTable.createdAt,
			quest: questsTable,
			save: savesTable,
		})
		.from(listItemsTable)
		.leftJoin(questsTable, eq(listItemsTable.questId, questsTable.id))
		.leftJoin(savesTable, eq(listItemsTable.saveId, savesTable.id))
		.where(eq(listItemsTable.id, item.id));

	return c.json(enriched, HttpStatusCodes.CREATED);
};

export const removeListItem: AppRouteHandler<RemoveItemRoute> = async (c) => {
	const userId = c.var.userId;
	const { id, itemId } = c.req.valid("param");

	// Verify list belongs to user before allowing item removal
	const [list] = await db
		.select()
		.from(listsTable)
		.where(and(eq(listsTable.id, id), eq(listsTable.userId, userId)));

	if (!list) {
		return c.json({ message: "List not found" }, HttpStatusCodes.NOT_FOUND);
	}

	const [deleted] = await db
		.delete(listItemsTable)
		.where(and(eq(listItemsTable.id, itemId), eq(listItemsTable.listId, id)))
		.returning();

	if (!deleted) {
		return c.json({ message: "List item not found" }, HttpStatusCodes.NOT_FOUND);
	}
	return c.body(null, HttpStatusCodes.NO_CONTENT);
};
