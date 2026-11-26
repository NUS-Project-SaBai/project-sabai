CREATE TYPE "public"."guardians_contacted" AS ENUM('Yes', 'No', 'NotApplicable');--> statement-breakpoint
CREATE TYPE "public"."referral_service_class" AS ENUM('ChronicManagement', 'ImagingDiagnostics', 'DefinitiveTreatment', 'SymptomaticTreatment');--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referred_to_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "member_in_charge_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "guardians_contacted" "guardians_contacted";--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "class_of_service" "referral_service_class";--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "description_of_service" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "patient_summary_from_screening" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "remarks_at_booth" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "member_on_run_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "present_at_referral_party" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referral_party_results" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "follow_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "doctors_updated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "amount_paid_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "amount_paid_riels" integer;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "member_who_paid_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_to_id_referral_partners_id_fk" FOREIGN KEY ("referred_to_id") REFERENCES "public"."referral_partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_member_in_charge_id_users_id_fk" FOREIGN KEY ("member_in_charge_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_member_on_run_id_users_id_fk" FOREIGN KEY ("member_on_run_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_member_who_paid_id_users_id_fk" FOREIGN KEY ("member_who_paid_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;