CREATE TYPE "public"."referral_state" AS ENUM('CompletedFailure', 'New', 'Seen', 'Outgoing', 'CompletedSuccess', 'Completed', 'None');--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referred_for" text NOT NULL,
	"referral_notes" text,
	"referral_state" "referral_state" DEFAULT 'New' NOT NULL,
	"referral_outcome" text,
	"consult_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_consult_id_consults_id_fk" FOREIGN KEY ("consult_id") REFERENCES "public"."consults"("id") ON DELETE restrict ON UPDATE no action;
