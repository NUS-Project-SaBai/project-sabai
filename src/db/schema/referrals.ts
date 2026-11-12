import {
  pgTable,
  serial,
  timestamp,
  text,
  pgEnum,
  integer,
  uuid,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

import { REFERRAL_STATES } from "@/lib/constants/referralStates";
import { GUARDIANS_CONTACTED } from "@/lib/constants/referralGuardiansContacted";
import { REFERRAL_SERVICE_CLASSES } from "@/lib/constants/referralServiceClasses";
import { consults } from "./consults";
import { users } from "./users";
import { referralPartners } from "./referralPartners";

export const referralStateEnum = pgEnum("referral_state", REFERRAL_STATES);
export const guardiansContactedEnum = pgEnum(
  "guardians_contacted",
  GUARDIANS_CONTACTED,
);
export const referralServiceClassEnum = pgEnum(
  "referral_service_class",
  REFERRAL_SERVICE_CLASSES,
);

/*
Referrals Table:
- id: Primary key, auto-incrementing integer.
- referredFor: The reason the patient is referred.
- referredToId: Foreign key referencing the referral partner the patient is referred to. Deleting a partner that still has referrals is blocked (restrict); deactivate it instead.
- referralNotes: Free-text notes about the referral.
- referralState: Lifecycle state of the referral (e.g. 'New', 'Completed').
- referralOutcome: Free-text result of the referral.
- consultId: Foreign key referencing the consult. Deleting a consult that still has referrals is blocked (restrict).
- createdAt: Timestamp of when the referral was created.
- updatedAt: Timestamp of the last update to the referral (set by Drizzle on update).

Referral booth section:
- memberInChargeId: Foreign key referencing the user (public.users) in charge of the referral at the booth.
- guardiansContacted: Whether the patient's guardians were contacted (Yes / No / NotApplicable).
- classOfService: Class of service the patient is referred for (e.g. 'ChronicManagement', 'ImagingDiagnostics').
- descriptionOfService: Description of the service the patient is referred for.
- patientSummaryFromScreening: Summary of the patient carried over from screening.
- remarksAtBooth: Free-text remarks made at the booth.

Referral party section (booleans default to false):
- memberOnRunId: Foreign key referencing the user (public.users) on the referral run.
- presentAtReferralParty: Whether the patient was present at the referral party.
- referralPartyResults: Free-text results from the referral party.
- followUp: Whether the patient needs a follow-up.
- doctorsUpdated: Whether the doctors have been updated on the results.

Money section:
- amountPaidUsd: Amount paid in US dollars, numeric(10,2) to avoid float rounding (returned as a string).
- amountPaidRiels: Amount paid in Cambodian riels, whole numbers only.
- memberWhoPaidId: Foreign key referencing the user (public.users) who paid.
*/
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referredFor: text("referred_for").notNull(),
  referredToId: uuid("referred_to_id").references(() => referralPartners.id, {
    onDelete: "restrict",
  }),
  referralNotes: text("referral_notes"),
  referralState: referralStateEnum("referral_state").default("New").notNull(),
  referralOutcome: text("referral_outcome"),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id, {
      onDelete: "restrict",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),

  // Referral booth section
  memberInChargeId: uuid("member_in_charge_id").references(() => users.id),
  guardiansContacted: guardiansContactedEnum("guardians_contacted"),
  classOfService: referralServiceClassEnum("class_of_service"),
  descriptionOfService: text("description_of_service"),
  patientSummaryFromScreening: text("patient_summary_from_screening"),
  remarksAtBooth: text("remarks_at_booth"),

  // Referral party section
  memberOnRunId: uuid("member_on_run_id").references(() => users.id),
  presentAtReferralParty: boolean("present_at_referral_party")
    .default(false)
    .notNull(),
  referralPartyResults: text("referral_party_results"),
  followUp: boolean("follow_up").default(false).notNull(),
  doctorsUpdated: boolean("doctors_updated").default(false).notNull(),

  // Money section
  amountPaidUsd: numeric("amount_paid_usd", { precision: 10, scale: 2 }),
  amountPaidRiels: integer("amount_paid_riels"),
  memberWhoPaidId: uuid("member_who_paid_id").references(() => users.id),
});

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
