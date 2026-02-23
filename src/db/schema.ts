import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define enums
export const genderEnum = pgEnum("gender", ["male", "female"]);

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
- has_poor_card: Indicates if the patient has a POOR card or not.
- has_bs2_card: Indicates if the patient has a BS2 card or not.
- has_sabai_card: Indicates if the patient has a Sabai card or not.
- patientImageId: Cloudinary ID of the patient's image.
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
  patientImageId: text("patient_image_id").notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
