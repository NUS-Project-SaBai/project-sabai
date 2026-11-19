-- created_by held free-text sender names, which cannot be mapped to users.id.
ALTER TABLE "broadcasts" ALTER COLUMN "created_by" SET DATA TYPE uuid USING NULL;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
