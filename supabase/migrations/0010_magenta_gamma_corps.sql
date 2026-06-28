CREATE TABLE "consults" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"past_medical_history" text,
	"consultation" text,
	"treatment_plan" text,
	"remarks" text,
	"doctor_id" uuid,
	"visit_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnosis" (
	"id" serial PRIMARY KEY NOT NULL,
	"details" text NOT NULL,
	"category" varchar(255),
	"consult_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consults" ADD CONSTRAINT "consults_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consults" ADD CONSTRAINT "consults_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnosis" ADD CONSTRAINT "diagnosis_consult_id_consults_id_fk" FOREIGN KEY ("consult_id") REFERENCES "public"."consults"("id") ON DELETE cascade ON UPDATE no action;