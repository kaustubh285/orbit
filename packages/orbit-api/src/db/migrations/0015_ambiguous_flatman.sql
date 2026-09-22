ALTER TABLE "saves" ADD COLUMN "watchedCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "last_watched_at" timestamp with time zone;