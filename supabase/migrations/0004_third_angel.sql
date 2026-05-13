CREATE TYPE "public"."medication_status" AS ENUM('active', 'disposed', 'donated', 'expired');--> statement-breakpoint
CREATE TABLE "medication_active_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit_of_measurement" varchar(255) NOT NULL,
	"fall_below" integer
);
--> statement-breakpoint
CREATE TABLE "medication_brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"active_ingredient_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_brand_id" integer NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"expiry" timestamp,
	"location" varchar(255),
	"state" "medication_status" DEFAULT 'active'
);
--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "has_poor_card" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "has_bs2_card" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "has_sabai_card" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "medication_brands" ADD CONSTRAINT "medication_brands_active_ingredient_id_medication_active_ingredients_id_fk" FOREIGN KEY ("active_ingredient_id") REFERENCES "public"."medication_active_ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_stock" ADD CONSTRAINT "medication_stock_medication_brand_id_medication_brands_id_fk" FOREIGN KEY ("medication_brand_id") REFERENCES "public"."medication_brands"("id") ON DELETE restrict ON UPDATE no action;