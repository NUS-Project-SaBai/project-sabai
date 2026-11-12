import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/*
Referral Partners Table:
- id: Primary key, randomly generated UUID.
- name: Name of the referral partner (e.g. a hospital or clinic).
- remarks: Free-text remarks about the referral partner.
- isActive: Whether the referral partner is currently active. Defaults to true.
- createdAt: Timestamp of when the record was created.
- updatedAt: Timestamp of when the record was last updated.
*/
export const referralPartners = pgTable("referral_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  remarks: text("remarks"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ReferralPartner = typeof referralPartners.$inferSelect;
export type NewReferralPartner = typeof referralPartners.$inferInsert;
