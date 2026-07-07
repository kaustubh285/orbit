import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt, deletedAt } from "../schema.helper";

export const aiModelEnum = pgEnum("ai_model", ["none", "sarvam", "haiku"]);

export const usersTable = pgTable("users", {
	id: id.primaryKey(),
	createdAt,
	updatedAt,
	deletedAt,
	// personal
	name: text("name").notNull(),
	displayName: text("display_name"),
	bio: text("bio"),
	email: text("email").notNull().unique(),
	avatar: text("avatar"),

	// metadata
	country: text("country"),
	timezone: text("timezone"),
	clerkUUID: text("clerk_uuid").notNull().unique(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

	// preferences
	aiModel: aiModelEnum("ai_model").notNull().default("sarvam"),

	// static credential for iOS Shortcut / Pi capture (generated on demand)
	captureToken: text("capture_token").unique(),
});
