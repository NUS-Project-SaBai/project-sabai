import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

import { authUsers } from "./auth";

/*
Users Table:
App-level record of a person (doctor, pharmacist, volunteer, ...). Decoupled from
Supabase auth so that historical users without a login can still be referenced
by FKs (consults, stock changes, etc.).
- id: Primary key, UUID. This is the ID other tables should reference.
- authUserId: Nullable FK to the Supabase auth user. NULL for users without an
  account. Unique, so an auth account maps to at most one app user. Set to NULL
  if the auth account is deleted, so the user's history is kept.
- name: Display name of the user.
- year: Year of study. Varchar because non-numeric values like "dr" are allowed.
- team: Team the user belongs to.  (e.g. PL, PN)
- role: Role of the user (e.g. PL Head, PN Head)
- remarks: Additional remarks.
- createdAt: Timestamp of when the record was created.
- updatedAt: Timestamp of when the record was last updated.
*/
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id")
    .unique()
    .references(() => authUsers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  year: varchar("year", { length: 255 }),
  team: varchar("team", { length: 255 }),
  role: varchar("role", { length: 255 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
