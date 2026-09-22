import { and, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { queueTable } from "../../db/schemas/queue.schema.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type { CreateRoute, ListRoute, RemoveRoute } from "./routes.js";

export const listQueue: AppRouteHandler<ListRoute> = async (c) => {
	const userId = c.var.userId;

	const rows = await db
		.select({
			queueId: queueTable.id,
			queueCreatedAt: queueTable.createdAt,
			...getTableColumns(savesTable),
		})
		.from(queueTable)
		.innerJoin(savesTable, and(eq(savesTable.id, queueTable.saveId), isNull(savesTable.deletedAt)))
		.where(eq(queueTable.userId, userId))
		.orderBy(desc(queueTable.createdAt));

	const items = rows.map(({ queueId, queueCreatedAt, ...save }) => ({
		id: queueId,
		createdAt: queueCreatedAt.toISOString(),
		save,
	}));

	return c.json(items, HttpStatusCodes.OK);
};

export const createQueueItem: AppRouteHandler<CreateRoute> = async (c) => {
	const userId = c.var.userId;
	const { saveId } = c.req.valid("json");

	const save = await db.query.savesTable.findFirst({
		where: and(eq(savesTable.id, saveId), eq(savesTable.userId, userId), isNull(savesTable.deletedAt)),
	});
	if (!save) return c.json({ message: "Save not found" }, HttpStatusCodes.NOT_FOUND);

	const existing = await db.query.queueTable.findFirst({
		where: and(eq(queueTable.userId, userId), eq(queueTable.saveId, saveId)),
	});
	if (existing) return c.json({ message: "Already in queue" }, HttpStatusCodes.CONFLICT);

	const [item] = await db.insert(queueTable).values({ userId, saveId }).returning();

	return c.json({ id: item.id, createdAt: item.createdAt.toISOString(), save }, HttpStatusCodes.CREATED);
};

export const removeQueueItem: AppRouteHandler<RemoveRoute> = async (c) => {
	const userId = c.var.userId;
	const { id } = c.req.valid("param");

	const deleted = await db
		.delete(queueTable)
		.where(and(eq(queueTable.id, id), eq(queueTable.userId, userId)))
		.returning({ id: queueTable.id });

	if (!deleted.length) return c.json({ message: "Queue item not found" }, HttpStatusCodes.NOT_FOUND);

	return c.body(null, HttpStatusCodes.NO_CONTENT);
};
