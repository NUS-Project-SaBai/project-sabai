import type { Referral } from "@/db/schema/referrals";

export type ReferralState = Referral["referralState"];

// Display order for the status dropdown, following the referral lifecycle.
// Kept separate from referralStateEnum so client bundles don't pull in drizzle.
export const REFERRAL_STATES = [
  "None",
  "New",
  "Seen",
  "Outgoing",
  "Completed",
  "CompletedSuccess",
  "CompletedFailure",
] as const satisfies readonly ReferralState[];
