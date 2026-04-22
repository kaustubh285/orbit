import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schema.helper";

export const usersTable = pgTable("users", {
	id: id.primaryKey(),
	createdAt,
	updatedAt,

	// personal
	name: text("name").notNull(),
	displayName: text("display_name"),
	bio: text("bio"),
	email: text("email").notNull().unique(),
	avatar: text("avatar"),
	passwordHash: text("password_hash"),


	// metadata
	country: text("country"),
	timezone: text("timezone"),
	clerkUUID: text("clerk_uuid").notNull().unique(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
