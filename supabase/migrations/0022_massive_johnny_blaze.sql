CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"s3_key" text NOT NULL,
	"content_type" text NOT NULL,
	"file_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "files_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_patient_id_created_at_idx" ON "files" USING btree ("patient_id","created_at" DESC NULLS LAST);