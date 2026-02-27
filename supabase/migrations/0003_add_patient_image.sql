ALTER TABLE "patients" RENAME COLUMN "poor" TO "has_poor_card";--> statement-breakpoint
ALTER TABLE "patients" RENAME COLUMN "bs2" TO "has_bs2_card";--> statement-breakpoint
ALTER TABLE "patients" RENAME COLUMN "sabai_card" TO "has_sabai_card";--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "patient_image_public_id" text NOT NULL;--> statement-breakpoint

-- Manually added: convert enum columns to boolean before dropping type
ALTER TABLE "patients"
  ALTER COLUMN "has_poor_card" TYPE boolean
  USING CASE WHEN "has_poor_card"::text = 'yes' THEN true ELSE false END;--> statement-breakpoint
ALTER TABLE "patients"
  ALTER COLUMN "has_bs2_card" TYPE boolean
  USING CASE WHEN "has_bs2_card"::text = 'yes' THEN true ELSE false END;--> statement-breakpoint
ALTER TABLE "patients"
  ALTER COLUMN "has_sabai_card" TYPE boolean
  USING CASE WHEN "has_sabai_card"::text = 'yes' THEN true ELSE false END;--> statement-breakpoint

DROP TYPE "public"."yes_no";
