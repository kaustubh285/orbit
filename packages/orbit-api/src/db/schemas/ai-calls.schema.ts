import { boolean, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../schema.helper";
import { usersTable } from "./users.schema";

export const aiCallsTable = pgTable(
	"ai_calls",
	{
		id: id.primaryKey(),
		createdAt,
		userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),

		// what was called
		model: text("model").notNull(),
		feature: text("feature").notNull(), // e.g. "voice_transcribe", "parse_quest", "ai_overview"

		// usage
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		latencyMs: integer("latency_ms"),

		// outcome
		success: boolean("success").notNull().default(true),
		errorCode: text("error_code"),
	},
	(table) => ({
		userIdx: index("ai_calls_user_idx").on(table.userId),
		featureIdx: index("ai_calls_feature_idx").on(table.feature),
		createdAtIdx: index("ai_calls_created_at_idx").on(table.createdAt),
	}),
);
