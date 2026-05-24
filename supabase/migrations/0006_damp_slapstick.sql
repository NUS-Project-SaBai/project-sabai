CREATE TABLE "vitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"height" numeric(5, 2),
	"weight" numeric(5, 2),
	"temperature" numeric(4, 2),
	"systolic" integer,
	"diastolic" integer,
	"heart_rate" integer,
	"left_eye_degree" text,
	"right_eye_degree" text,
	"left_eye_pinhole" text,
	"right_eye_pinhole" text,
	"left_astigmatism" text,
	"right_astigmatism" text,
	"hemocue_count" numeric(5, 2),
	"diabetes_mellitus" boolean,
	"urine_test" text,
	"blood_glucose_non_fasting" numeric(5, 2),
	"blood_glucose_fasting" numeric(5, 2),
	"hba1c" numeric(5, 2),
	"others" text,
	"visit_id" integer NOT NULL,
	CONSTRAINT "vitals_visit_id_unique" UNIQUE("visit_id")
);
--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;