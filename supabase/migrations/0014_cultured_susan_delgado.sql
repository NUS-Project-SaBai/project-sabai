CREATE TYPE "public"."order_status" AS ENUM('APPROVED', 'CANCELLED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."stock_change_field_enum" AS ENUM('location', 'quantity', 'stock_status');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"consult_id" integer NOT NULL,
	"dosage_instructions" text NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"stock_change_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"field" "stock_change_field_enum" NOT NULL,
	"previous_value" varchar NOT NULL,
	"new_value" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_consult_id_consults_id_fk" FOREIGN KEY ("consult_id") REFERENCES "public"."consults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_stock_change_id_stock_changes_id_fk" FOREIGN KEY ("stock_change_id") REFERENCES "public"."stock_changes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_changes" ADD CONSTRAINT "stock_changes_stock_id_medication_stock_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."medication_stock"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_changes" ADD CONSTRAINT "stock_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;