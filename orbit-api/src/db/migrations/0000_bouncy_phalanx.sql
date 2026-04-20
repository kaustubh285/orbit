CREATE TYPE "public"."quest_priority" AS ENUM('urgent', 'important', 'quick_win', 'deep_work', 'someday', 'waiting');--> statement-breakpoint
CREATE TYPE "public"."quest_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."quest_type" AS ENUM('todo', 'note', 'event', 'daily');--> statement-breakpoint
CREATE TYPE "public"."save_platform" AS ENUM('youtube', 'reddit', 'instagram', 'web');--> statement-breakpoint
CREATE TYPE "public"."save_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"bio" text,
	"email" text NOT NULL,
	"avatar" text,
	"password_hash" text,
	"country" text,
	"timezone" text,
	"clerk_uuid" text NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_clerk_uuid_unique" UNIQUE("clerk_uuid")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "quest_type" NOT NULL,
	"status" "quest_status" DEFAULT 'active' NOT NULL,
	"priority" "quest_priority",
	"title" text NOT NULL,
	"body" text,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"location" text,
	"last_completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"source_platform" "save_platform" DEFAULT 'web' NOT NULL,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"author" text,
	"published_at" timestamp with time zone,
	"note" text,
	"status" "save_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"list_id" uuid NOT NULL,
	"quest_id" uuid,
	"save_id" uuid,
	CONSTRAINT "list_items_exactly_one" CHECK (("list_items"."quest_id" IS NOT NULL) <> ("list_items"."save_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text
);
--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_save_id_saves_id_fk" FOREIGN KEY ("save_id") REFERENCES "public"."saves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quests_user_status_idx" ON "quests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "quests_user_type_idx" ON "quests" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "quests_due_at_idx" ON "quests" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "quests_start_at_idx" ON "quests" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "saves_user_status_idx" ON "saves" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "saves_user_platform_idx" ON "saves" USING btree ("user_id","source_platform");--> statement-breakpoint
CREATE INDEX "saves_created_at_idx" ON "saves" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "list_items_list_quest_unique" ON "list_items" USING btree ("list_id","quest_id") WHERE "list_items"."quest_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "list_items_list_save_unique" ON "list_items" USING btree ("list_id","save_id") WHERE "list_items"."save_id" IS NOT NULL;