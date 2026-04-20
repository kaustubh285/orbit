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

export const savePlatformEnum = pgEnum("save_platform", [
	"youtube",
	"reddit",
	"instagram",
	"web",
]);

export const saveStatusEnum = pgEnum("save_status", [
	"active",
	"archived",
]);

export const savesTable = pgTable(
	"saves",
	{
		id: id.primaryKey(),
		createdAt,
		updatedAt,

		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),

		// captured from share + baseline OG/oEmbed scrape
		sourceUrl: text("source_url").notNull(),
		sourcePlatform: savePlatformEnum("source_platform")
			.notNull()
			.default("web"),
		title: text("title"),
		description: text("description"),
		thumbnailUrl: text("thumbnail_url"),
		author: text("author"), // channel / subreddit / username — platform-agnostic
		publishedAt: timestamp("published_at", { withTimezone: true }),

		// user annotation — the "why I cared" note captured at save time
		note: text("note"),

		status: saveStatusEnum("status").notNull().default("active"),
	},
	(table) => ({
		userStatusIdx: index("saves_user_status_idx").on(
			table.userId,
			table.status,
		),
		userPlatformIdx: index("saves_user_platform_idx").on(
			table.userId,
			table.sourcePlatform,
		),
		createdAtIdx: index("saves_created_at_idx").on(table.createdAt),
	}),
);
