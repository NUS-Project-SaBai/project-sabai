CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"drive_file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;