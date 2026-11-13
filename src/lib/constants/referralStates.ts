// Single source of truth for referral states, shared by referralStateEnum
// (src/db/schema/referrals.ts) and the status dropdown. Order matters here:
// changing it changes the Postgres enum's declaration order and generates
// a migration.
export const REFERRAL_STATES = [
  "CompletedFailure",
  "New",
  "Seen",
  "Outgoing",
  "CompletedSuccess",
  "Completed",
  "None",
] as const;

export type ReferralState = (typeof REFERRAL_STATES)[number];
