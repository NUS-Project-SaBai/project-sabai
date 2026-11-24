import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

import {
  BROADCAST_SEVERITIES,
  BROADCAST_TITLE_MAX_LENGTH,
} from "@/lib/constants/broadcasts";

export const broadcastSeverityEnum = pgEnum(
  "broadcast_severity",
  BROADCAST_SEVERITIES,
);

/*
Broadcasts Table:
- id: Primary key, auto-incrementing integer.
- title: Short headline of the broadcast.
- body: Full message body.
- severity: Drives the toast styling ('info', 'warning', 'critical').
- createdBy: Nullable FK to the sending user. NULL if the sender has no linked
  users row. Deleting a user who has sent broadcasts is blocked, so a sender
  stays traceable.
- createdAt: Timestamp used for ordering.
- publishedAt: Transactional-outbox flag. NULL = committed but not yet emitted to Realtime.
  A timestamp = emitted. The retry relay sweeps rows where this is still NULL.
- attempts: Retry accounting. Incremented on each failed push; a row is dead-lettered
  once it exceeds the max-attempt threshold.
*/
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: BROADCAST_TITLE_MAX_LENGTH }).notNull(),
  body: text("body").notNull(),
  severity: broadcastSeverityEnum("severity").default("info").notNull(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "restrict",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  attempts: integer("attempts").default(0).notNull(),
}).enableRLS();

export type Broadcast = typeof broadcasts.$inferSelect;
export type NewBroadcast = typeof broadcasts.$inferInsert;
