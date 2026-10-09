import {
  pgTable,
  serial,
  timestamp,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

import { patients } from "./patients";

/*
Files Table (patient documents such as referral letters and scans, stored in Google Drive):
- id: Primary key, auto-incrementing integer.
- patientId: Foreign key referencing the patient. Set to null if the patient is deleted.
- driveFileId: ID of the file in Google Drive. The view link is built from this ID.
- fileName: Display name of the file. Renaming also renames the file on Google Drive.
- description: Free-text description of the file.
- isDeleted: Soft-delete flag. Deleting a file never removes it from Google Drive.
- createdAt: Timestamp of when the file was uploaded.
*/
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id, {
    onDelete: "set null",
  }),
  driveFileId: text("drive_file_id").notNull(),
  fileName: text("file_name").notNull(),
  description: text("description").default("").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PatientFile = typeof files.$inferSelect;
export type NewPatientFile = typeof files.$inferInsert;
