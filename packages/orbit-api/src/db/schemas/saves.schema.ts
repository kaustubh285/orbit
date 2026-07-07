import { sql } from "drizzle-orm";
import {
	pgTable,
	pgEnum,
	text,
	uuid,
	timestamp,
	boolean,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, deletedAt } from "../schema.helper";
import { usersTable } from "./users.schema";


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
		deletedAt,
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),

		// captured from share + baseline OG/oEmbed scrape
		sourceUrl: text("source_url").notNull(),
		normalizedUrl: text("normalized_url"),
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

		tags: text("tags").array().notNull().default([]),

		status: saveStatusEnum("status").notNull().default("active"),


		// AI
		shouldAISummaries: boolean("should_ai_summaries").notNull().default(false),
		aiTitle: text("ai_title"),
		aiSummary: text("ai_summary"),
		locationName: text(""),
		locationLat: text(""),
		locationLng: text(""),
		aiEnrichedAt: timestamp({ withTimezone: true }),

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
		// partial unique: closes the check-then-insert race on dupe detection,
		// while still allowing re-saves of soft-deleted items
		userNormalizedUrlUniq: uniqueIndex("saves_user_normalized_url_uniq")
			.on(table.userId, table.normalizedUrl)
			.where(sql`${table.deletedAt} is null`),
	}),
);
