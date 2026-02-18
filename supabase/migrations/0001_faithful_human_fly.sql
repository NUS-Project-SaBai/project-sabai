CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."yes_no" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"village_code_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"identification_number" varchar(255),
	"contact_no" varchar(255),
	"gender" "gender" NOT NULL,
	"drug_allergy" text NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"poor" "yes_no" NOT NULL,
	"bs2" "yes_no" NOT NULL,
	"sabai_card" "yes_no" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_village_code_id_village_codes_id_fk" FOREIGN KEY ("village_code_id") REFERENCES "public"."village_codes"("id") ON DELETE no action ON UPDATE no action;