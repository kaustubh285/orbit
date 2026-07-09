ALTER TABLE "saves" ADD COLUMN "last_surfaced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "resurface_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "last_interacted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "include_in_resurface" text DEFAULT 'false' NOT NULL;