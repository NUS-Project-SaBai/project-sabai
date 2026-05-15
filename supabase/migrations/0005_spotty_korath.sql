CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"patient_id" integer NOT NULL,
	"village_code_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_village_code_id_village_codes_id_fk" FOREIGN KEY ("village_code_id") REFERENCES "public"."village_codes"("id") ON DELETE no action ON UPDATE no action;