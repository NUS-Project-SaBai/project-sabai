import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const broadcastSeverityEnum = pgEnum("broadcast_severity", [
  "info",
  "warning",
  "critical",
]);

export const broadcastSeverityValues = broadcastSeverityEnum.enumValues;

/*
Broadcasts Table:
- id: Primary key, auto-incrementing integer.
- title: Short headline of the broadcast.
- body: Full message body.
- severity: Drives the toast styling ('info', 'warning', 'critical').
- createdBy: Sender's identifier.
- createdAt: Timestamp used for ordering.
- publishedAt: Transactional-outbox flag. NULL = committed but not yet emitted to
  Having a timestamp = emitted. The retry relay sweeps rows where this is still NULL.
- attempts: Retry accounting. Incremented on each failed push; a row is dead-lettered
  once it exceeds the max-attempt threshold.
*/
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  severity: broadcastSeverityEnum("severity").default("info").notNull(),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  attempts: integer("attempts").default(0).notNull(),
});

export type Broadcast = typeof broadcasts.$inferSelect;
export type NewBroadcast = typeof broadcasts.$inferInsert;
