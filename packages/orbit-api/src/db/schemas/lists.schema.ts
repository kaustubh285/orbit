import {
	pgTable,
	text,
	uuid,
	check,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { id, createdAt, updatedAt } from "../schema.helper.js";
import { usersTable } from "./users.schema.js";
import { questsTable } from "./quests.schema.js";
import { savesTable } from "./saves.schema.js"; // wired in when saves lands


export const listsTable = pgTable("lists", {
	id: id.primaryKey(),
	createdAt,
	updatedAt,

	userId: uuid("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	description: text("description"),
	color: text("color"), // hex or token, for UI distinction
});

// Cross-domain junction: a row links a list to EITHER a quest OR a save.
// Exactly one of questId/saveId must be set per row (enforced by CHECK).
// Partial unique indexes prevent duplicating a quest or save within a list.
export const listItemsTable = pgTable(
	"list_items",
	{
		id: id.primaryKey(),
		createdAt,

		listId: uuid("list_id")
			.notNull()
			.references(() => listsTable.id, { onDelete: "cascade" }),

		questId: uuid("quest_id").references(() => questsTable.id, {
			onDelete: "cascade",
		}),

		// Added in the saves migration:
		saveId: uuid("save_id").references(() => savesTable.id, { onDelete: "cascade" }),
	},
	(table) => ({
		exactlyOneItem: check(
			"list_items_exactly_one",
			sql`(${table.questId} IS NOT NULL) <> (${table.saveId} IS NOT NULL)`,
		),
		uniqueQuestPerList: uniqueIndex("list_items_list_quest_unique")
			.on(table.listId, table.questId)
			.where(sql`${table.questId} IS NOT NULL`),
		uniqueSavePerList: uniqueIndex("list_items_list_save_unique")
			.on(table.listId, table.saveId)
			.where(sql`${table.saveId} IS NOT NULL`),
	}),
);
