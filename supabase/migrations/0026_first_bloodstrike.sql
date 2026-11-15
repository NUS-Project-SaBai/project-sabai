ALTER TABLE "consults" DROP CONSTRAINT "consults_doctor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_changes" DROP CONSTRAINT "stock_changes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "consults" ADD CONSTRAINT "consults_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_changes" ADD CONSTRAINT "stock_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;