ALTER TABLE "patients" DROP CONSTRAINT "patients_village_code_id_village_codes_id_fk";
--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "village_code_id";