import {
  pgTable,
  pgSchema,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  pgEnum,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

import { consults } from "./consults";

// Stub for Supabase-managed auth schema — not migrated, used only for FK references
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// Define enums
export const genderEnum = pgEnum("gender", ["male", "female"]);

export const referralStateEnum = pgEnum("referral_state", [
  "CompletedFailure",
  "New",
  "Seen",
  "Outgoing",
  "CompletedSuccess",
  "Completed",
  "None",
]);

// Define tables

/*
Village Codes Table:
- id: Primary key, auto-incrementing integer.
- code: Unique code for the village (e.g., "V001").
- name: Name of the village (e.g., "Village A").
- colorHex: Hexadecimal color code for the village (e.g., "#FF5733").
- isVisible: Boolean indicating whether the village code is visible in the application.
- createdAt: Timestamp of when the record was created.
- updatedAt: Timestamp of when the record was last updated.   
*/
export const villageCodes = pgTable("village_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  colorHex: varchar("color_hex", { length: 7 }).notNull(), // maps to 'color_hex' in DB
  isVisible: boolean("is_visible").default(true).notNull(), // maps to 'is_visible' in DB
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type VillageCode = typeof villageCodes.$inferSelect;
export type NewVillageCode = typeof villageCodes.$inferInsert;

/*
Patients Table:
- id: Primary key, auto-incrementing integer.
- villageCodeId: Foreign key referencing the village code.
- name: Name of the patient.
- identificationNumber: Identification number of the patient.
- contactNo: Contact number of the patient.
- gender: Gender of the patient.
- drugAllergy: Drug allergy information of the patient.
- dateOfBirth: Date of birth of the patient.
- hasPoorCard Indicates if the patient has a POOR card or not.
- hasBS2Card: Indicates if the patient has a BS2 card or not.
- hasSabaiCard: Indicates if the patient has a Sabai card or not.
- patientImagePublicId: Cloudinary public ID of the patient's image.
- rekognitionFaceId: Rekognition Face ID for facial recognition.
*/
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  identificationNumber: varchar("identification_number", { length: 255 }),
  contactNo: varchar("contact_no", { length: 255 }),
  gender: genderEnum("gender").notNull(),
  drugAllergy: text("drug_allergy").notNull(),
  dateOfBirth: timestamp("date_of_birth", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  hasPoorCard: boolean("has_poor_card").notNull(),
  hasBS2Card: boolean("has_bs2_card").notNull(),
  hasSabaiCard: boolean("has_sabai_card").notNull(),
  patientImagePublicId: text("patient_image_public_id").notNull(),
  rekognitionFaceId: text("rekognition_face_id"),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

/*
Visits Table:
- id: Primary key, auto-incrementing integer.
- date: Date and time of the visit.
- patientId: Foreign key referencing the patient.
- villageCodeId: Foreign key referencing the village code.
 */
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  villageCodeId: integer("village_code_id")
    .notNull()
    .references(() => villageCodes.id),
});

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

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
