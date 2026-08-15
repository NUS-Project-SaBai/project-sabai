import {
  pgTable,
  serial,
  timestamp,
  text,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

import { consults } from "./consults";

export const referralStateEnum = pgEnum("referral_state", [
  "CompletedFailure",
  "New",
  "Seen",
  "Outgoing",
  "CompletedSuccess",
  "Completed",
  "None",
]);

/*
Referrals Table:
- id: Primary key, auto-incrementing integer.
- referredFor: The reason the patient is referred.
- referralNotes: Free-text notes about the referral.
- referralState: Lifecycle state of the referral (e.g. 'New', 'Completed').
- referralOutcome: Free-text result of the referral.
- consultId: Foreign key referencing the consult. Deleting a consult that still has referrals is blocked (restrict).
- createdAt: Timestamp of when the referral was created.
*/
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referredFor: text("referred_for").notNull(),
  referralNotes: text("referral_notes"),
  referralState: referralStateEnum("referral_state").default("New").notNull(),
  referralOutcome: text("referral_outcome"),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id, {
      onDelete: "restrict",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
