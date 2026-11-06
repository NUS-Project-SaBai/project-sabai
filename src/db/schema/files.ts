import {
  pgTable,
  serial,
  timestamp,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";

import { patients } from "./patients";

/*
Files Table (patient documents such as referral letters and scans, stored in s3):
- id: Primary key, auto-incrementing integer.
- patientId: Foreign key referencing the patient. 
- s3Key: Key of the object in the S3 bucket. View links are presigned from this key. Unique, so one
  uploaded object can't be registered twice.
- contentType: MIME type S3 reported for the object at upload (one of ALLOWED_FILE_TYPES). View links
  are served with this type.
- fileName: Display name of the file. 
- description: Free-text description of the file.
- isDeleted: Soft-delete flag. Deleting a file never removes it from S3.
- createdAt: Timestamp of when the file was uploaded.
*/
export const files = pgTable(
  "files",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id").references(() => patients.id, {
      onDelete: "set null",
    }),
    s3Key: text("s3_key").notNull().unique(),
    contentType: text("content_type").notNull(),
    fileName: text("file_name").notNull(),
    description: text("description").default("").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  // listByPatientId filters by patient and sorts newest first.
  (table) => [
    index("files_patient_id_created_at_idx").on(
      table.patientId,
      table.createdAt.desc(),
    ),
  ],
);

export type PatientFile = typeof files.$inferSelect;
export type NewPatientFile = typeof files.$inferInsert;
