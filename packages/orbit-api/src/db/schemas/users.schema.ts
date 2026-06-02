import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
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

	// metadata
	country: text("country"),
	timezone: text("timezone"),
	clerkUUID: text("clerk_uuid").notNull().unique(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
