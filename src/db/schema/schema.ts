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

import { villageCodes } from "./villageCodes";

// Stub for Supabase-managed auth schema — not migrated, used only for FK references
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// Define enums
export const genderEnum = pgEnum("gender", ["male", "female"]);

// Define tables

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
