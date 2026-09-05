CREATE TABLE "order_items" (
	"order_id" integer NOT NULL,
	"stock_change_id" integer NOT NULL,
	CONSTRAINT "order_items_order_id_stock_change_id_pk" PRIMARY KEY("order_id","stock_change_id")
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_stock_change_id_stock_changes_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantity" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_stock_change_id_stock_changes_id_fk" FOREIGN KEY ("stock_change_id") REFERENCES "public"."stock_changes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "stock_change_id";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "quantity_check" CHECK ("orders"."quantity" > 0);