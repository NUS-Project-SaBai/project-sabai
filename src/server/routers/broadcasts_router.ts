import { desc, eq, gt, sql } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import {
  BROADCAST_TITLE_MAX_LENGTH,
  broadcasts,
  broadcastSeverityValues,
} from "@/db/schema";
import { db } from "@/db/drizzle";
import { protectedProcedure, router } from "@/server/trpc";
import { publishBroadcast } from "@/server/utils/realtime";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
// Keeps every broadcast far below Supabase Realtime's payload limit.
const BODY_MAX_LENGTH = 5000;
// created_by is varchar(255).
const SENDER_MAX_LENGTH = 255;

const listInputSchema = z
  .object({
    limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    since: z.number().int().optional(),
  })
  .optional();

const sendInputSchema = z.object({
  title: z.string().trim().min(1).max(BROADCAST_TITLE_MAX_LENGTH),
  body: z.string().trim().min(1).max(BODY_MAX_LENGTH),
  severity: z.enum(broadcastSeverityValues).default("info"),
});

// display_name is user-editable metadata, so check its type and length.
function getSenderName(user: User): string | null {
  const displayName = user.user_metadata?.display_name;
  const name =
    (typeof displayName === "string" && displayName.trim()) || user.email;
  return name ? name.slice(0, SENDER_MAX_LENGTH) : null;
}

export const broadcastsRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const limit = input?.limit ?? DEFAULT_LIMIT;
    const since = input?.since;

    // SQL query to fetch broadcasts
    return db
      .select()
      .from(broadcasts)
      .where(since === undefined ? undefined : gt(broadcasts.id, since))
      .orderBy(desc(broadcasts.id))
      .limit(limit);
  }),

  // Transactional outbox: the INSERT is the source of truth and the Realtime
  // push is best-effort. Rows left with published_at = NULL are for a retry
  // relay to pick up (not built yet).
  send: protectedProcedure
    .input(sendInputSchema)
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .insert(broadcasts)
        .values({ ...input, createdBy: getSenderName(ctx.user) })
        .returning();

      let published = true;
      try {
        await publishBroadcast({
          topic: "notifications",
          event: "new",
          payload: row,
        });
      } catch (error) {
        console.error(`Failed to publish broadcast ${row.id}:`, error);
        published = false;
      }

      // The row is already saved, so never throw from here: a client retry
      // would create a duplicate broadcast.
      try {
        const [updatedRow] = await db
          .update(broadcasts)
          .set(
            published
              ? { publishedAt: sql`now()` }
              : { attempts: sql`${broadcasts.attempts} + 1` },
          )
          .where(eq(broadcasts.id, row.id))
          .returning();
        return updatedRow;
      } catch (error) {
        console.error(
          `Failed to record publish result for broadcast ${row.id}:`,
          error,
        );
        return row;
      }
    }),
});
