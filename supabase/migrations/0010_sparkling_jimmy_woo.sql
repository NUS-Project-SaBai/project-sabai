ALTER TABLE "medication_stock" ALTER COLUMN "stock_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "medication_stock" ALTER COLUMN "stock_status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."medication_status";--> statement-breakpoint
CREATE TYPE "public"."medication_status" AS ENUM('active', 'discarded', 'donated', 'dispensed', 'reserved');--> statement-breakpoint
ALTER TABLE "medication_stock" ALTER COLUMN "stock_status" SET DEFAULT 'active'::"public"."medication_status";--> statement-breakpoint
ALTER TABLE "medication_stock" ALTER COLUMN "stock_status" SET DATA TYPE "public"."medication_status" USING "stock_status"::"public"."medication_status";--> statement-breakpoint
ALTER TABLE "medication_active_ingredients" ADD COLUMN "remarks" text NOT NULL;--> statement-breakpoint
ALTER TABLE "medication_brands" ADD COLUMN "remarks" text NOT NULL;--> statement-breakpoint
ALTER TABLE "medication_stock" ADD COLUMN "remarks" text NOT NULL;