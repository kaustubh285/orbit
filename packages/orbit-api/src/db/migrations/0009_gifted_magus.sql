ALTER TABLE "users" ADD COLUMN "capture_token" text;--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN "normalized_url" text;--> statement-breakpoint
CREATE INDEX "saves_user_normalized_url_idx" ON "saves" USING btree ("user_id","normalized_url");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_capture_token_unique" UNIQUE("capture_token");