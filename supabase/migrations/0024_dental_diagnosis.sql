CREATE TABLE "dental_diagnosis" (
	"id" serial PRIMARY KEY NOT NULL,
	"dental_id" integer NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dental_diagnosis" ADD CONSTRAINT "dental_diagnosis_dental_id_dental_id_fk" FOREIGN KEY ("dental_id") REFERENCES "public"."dental"("id") ON DELETE no action ON UPDATE no action;