CREATE TYPE "public"."dental_absent_present_not_assessed" AS ENUM('absent', 'present', 'not assessed');--> statement-breakpoint
CREATE TYPE "public"."dental_brushing_frequency" AS ENUM('once', 'twice', '3+ times', 'occasionally', 'never');--> statement-breakpoint
CREATE TYPE "public"."dental_caries" AS ENUM('absent', 'non-cavitated', 'cavitated');--> statement-breakpoint
CREATE TYPE "public"."dental_done_not_done" AS ENUM('done', 'not done');--> statement-breakpoint
CREATE TYPE "public"."dental_facial_symmetry" AS ENUM('normal', 'asymmetrical');--> statement-breakpoint
CREATE TYPE "public"."dental_gingival_condition" AS ENUM('healthy', 'inflamed', 'bleeding');--> statement-breakpoint
CREATE TYPE "public"."dental_malocclusion" AS ENUM('not suspected', 'suspected');--> statement-breakpoint
CREATE TYPE "public"."dental_normal_limited" AS ENUM('normal', 'limited');--> statement-breakpoint
CREATE TYPE "public"."dental_oral_hygiene" AS ENUM('good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."dental_plaque" AS ENUM('none', 'mild', 'moderate', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."dental_sugar_consumption" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."dental_yes_no_unknown" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
CREATE TABLE "dental" (
	"id" serial PRIMARY KEY NOT NULL,
	"previous_dental_visit" "dental_yes_no_unknown",
	"extraction" boolean,
	"previous_dental_treatment" "dental_yes_no_unknown",
	"toothache" boolean,
	"dental_trauma" boolean,
	"current_toothache" boolean,
	"tooth_sensitivity" boolean,
	"bleeding_gums" boolean,
	"brushing_frequency" "dental_brushing_frequency",
	"fluoride_toothpaste" "dental_yes_no_unknown",
	"sugar_consumption" "dental_sugar_consumption",
	"other_dental_history" varchar(255),
	"chief_complaint" varchar(255),
	"facial_symmetry" "dental_facial_symmetry",
	"facial_swelling" boolean,
	"lymphadenopathy" "dental_absent_present_not_assessed",
	"mouth_opening" "dental_normal_limited",
	"oral_hygiene" "dental_oral_hygiene",
	"plaque" "dental_plaque",
	"calculus" boolean,
	"gingival_condition" "dental_gingival_condition",
	"caries" "dental_caries",
	"missing_teeth" boolean,
	"fractured_teeth" boolean,
	"mucosal_lesions" boolean,
	"malocclusion" "dental_malocclusion",
	"fluoride_status" "dental_done_not_done",
	"fluoride_operator" varchar(255),
	"fluoride_tooth_number" varchar(255),
	"sealant_status" "dental_done_not_done",
	"sealant_operator" varchar(255),
	"sealant_tooth_number" varchar(255),
	"sdf_status" "dental_done_not_done",
	"sdf_operator" varchar(255),
	"sdf_tooth_number" varchar(255),
	"scaling_status" "dental_done_not_done",
	"scaling_operator" varchar(255),
	"scaling_tooth_number" varchar(255),
	"remarks" varchar(255),
	"image" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"visit_id" integer
);
--> statement-breakpoint
ALTER TABLE "dental" ADD CONSTRAINT "dental_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;