ALTER TABLE "lists" ALTER COLUMN "include_in_resurface" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lists" ALTER COLUMN "include_in_resurface" SET DATA TYPE boolean USING include_in_resurface::boolean;--> statement-breakpoint
ALTER TABLE "lists" ALTER COLUMN "include_in_resurface" SET DEFAULT false;
