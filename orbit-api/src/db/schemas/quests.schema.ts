import {
	pgTable,
	pgEnum,
	text,
	uuid,
	timestamp,
	index,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schema.helper.js";
import { usersTable } from "./users.schema.js";


export const questTypeEnum = pgEnum("quest_type", [
	"todo",
	"note",
	"event",
	"daily",
]);

export const questStatusEnum = pgEnum("quest_status", [
	"active",
	"completed",
	"archived",
]);

export const questPriorityEnum = pgEnum("quest_priority", [
	"urgent",
	"important",
	"quick_win",
	"deep_work",
	"someday",
	"waiting",
]);

export const questsTable = pgTable(
	"quests",
	{
		id: id.primaryKey(),
		createdAt,
		updatedAt,

		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),

		// core
		type: questTypeEnum("type").notNull(),
		status: questStatusEnum("status").notNull().default("active"),
		priority: questPriorityEnum("priority"), // nullable — not every quest needs one
		title: text("title").notNull(),
		body: text("body"), // long-form for notes; optional details for other types

		// todo-specific
		dueAt: timestamp("due_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),

		// event-specific
		startAt: timestamp("start_at", { withTimezone: true }),
		endAt: timestamp("end_at", { withTimezone: true }),
		location: text("location"),

		// daily-specific
		lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
	},
	(table) => ({
		userStatusIdx: index("quests_user_status_idx").on(table.userId, table.status),
		userTypeIdx: index("quests_user_type_idx").on(table.userId, table.type),
		dueAtIdx: index("quests_due_at_idx").on(table.dueAt),
		startAtIdx: index("quests_start_at_idx").on(table.startAt),
	}),
);
