CREATE TYPE "public"."ai_model" AS ENUM('none', 'sarvam', 'haiku');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_model" "ai_model" DEFAULT 'sarvam' NOT NULL;