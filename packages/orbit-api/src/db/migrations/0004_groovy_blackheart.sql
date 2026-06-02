ALTER TABLE "saves" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "locationName" text;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "locationLat" text;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "locationLng" text;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "aiEnrichedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";