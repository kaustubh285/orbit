CREATE TABLE "ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"model" text NOT NULL,
	"feature" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_code" text
);
--> statement-breakpoint
ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_calls_user_idx" ON "ai_calls" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_calls_feature_idx" ON "ai_calls" USING btree ("feature");--> statement-breakpoint
CREATE INDEX "ai_calls_created_at_idx" ON "ai_calls" USING btree ("createdAt");