import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

import { visits } from "./schema";
import { authUsers } from "./auth";
/*
Consults Table:
- id: Primary key, auto-incrementing integer.
- date: Timestamp of the consultation.
- pastMedicalHistory: Patient's past medical history notes.
- consultation: Doctor's consultation notes.
- treatmentPlan: Treatment plan.
- remarks: Additional remarks.
- doctorId: Foreign key referencing the Supabase auth user (doctor).
- visitId: Foreign key referencing the visit.
*/
export const consults = pgTable("consults", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  pastMedicalHistory: text("past_medical_history"),
  consultation: text("consultation"),
  treatmentPlan: text("treatment_plan"),
  remarks: text("remarks"),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => authUsers.id),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visits.id),
});

export type Consult = typeof consults.$inferSelect;
export type NewConsult = typeof consults.$inferInsert;

/*
Diagnosis Table:
- id: Primary key, auto-incrementing integer.
- details: Description of the diagnosis.
- category: Classification of the diagnosis (e.g. "Chronic", "Acute").
- consultId: Foreign key referencing the consult.
*/
export const diagnosis = pgTable("diagnosis", {
  id: serial("id").primaryKey(),
  details: text("details").notNull(),
  category: varchar("category", { length: 255 }),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id),
});

export type Diagnosis = typeof diagnosis.$inferSelect;
export type NewDiagnosis = typeof diagnosis.$inferInsert;
