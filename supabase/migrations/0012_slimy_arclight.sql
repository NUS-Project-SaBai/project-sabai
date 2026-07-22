CREATE TYPE "public"."referral_state" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referred_for" text NOT NULL,
	"referred_to" text,
	"referral_notes" text,
	"referral_state" "referral_state" DEFAULT 'pending',
	"referral_outcome" text,
	"consult_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_consult_id_consults_id_fk" FOREIGN KEY ("consult_id") REFERENCES "public"."consults"("id") ON DELETE restrict ON UPDATE no action;