-- order_items now points at the reserved medication_stock row instead of the
-- stock_changes audit row. The table is recreated rather than altered since no
-- released code writes to it.
DROP TABLE "order_items" CASCADE;--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_id" integer NOT NULL,
	"stock_id" integer NOT NULL,
	CONSTRAINT "order_items_order_id_stock_id_pk" PRIMARY KEY("order_id","stock_id")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_stock_id_medication_stock_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."medication_stock"("id") ON DELETE no action ON UPDATE no action;