// Watch-queue: ephemeral working memory ("watch these soon, then clear")

import { pgTable, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schema.helper";
import { savesTable } from "./saves.schema";
import { usersTable } from "./users.schema";


export const queueTable = pgTable("queue", {
	id: id.primaryKey(),
	createdAt,
	updatedAt,
	userId: uuid("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	saveId: uuid("save_id")
		.notNull()
		.references(() => savesTable.id, { onDelete: "cascade" }),
}, (table) => ({
	userSaveUniq: uniqueIndex("queue_user_save_uniq").on(table.userId, table.saveId),
}))
