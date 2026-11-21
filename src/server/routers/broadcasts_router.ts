import { desc, eq, getTableColumns, gt, sql } from "drizzle-orm";
import { z } from "zod";

import { broadcasts, users } from "@/db/schema";
import { db } from "@/db/drizzle";
import {
  BROADCAST_BODY_MAX_LENGTH,
  BROADCAST_NEW_EVENT,
  BROADCAST_SEVERITIES,
  BROADCAST_TOPIC,
  BROADCAST_LIST_DEFAULT_LIMIT,
  BROADCAST_LIST_MAX_LIMIT,
  BROADCAST_TITLE_MAX_LENGTH,
} from "@/lib/constants/broadcasts";
import { protectedProcedure, router } from "@/server/trpc";
import { publishBroadcast } from "@/server/utils/realtime";

const listInputSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(BROADCAST_LIST_MAX_LIMIT)
      .default(BROADCAST_LIST_DEFAULT_LIMIT),
    since: z.number().int().optional(),
  })
  .optional();

const sendInputSchema = z.object({
  title: z.string().trim().min(1).max(BROADCAST_TITLE_MAX_LENGTH),
  body: z.string().trim().min(1).max(BROADCAST_BODY_MAX_LENGTH),
  severity: z.enum(BROADCAST_SEVERITIES).default("info"),
});

export const broadcastsRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const limit = input?.limit ?? BROADCAST_LIST_DEFAULT_LIMIT;
    const since = input?.since;

    const query = db
      .select({ ...getTableColumns(broadcasts), senderName: users.name })
      .from(broadcasts)
      .leftJoin(users, eq(broadcasts.createdBy, users.id))
      .where(since === undefined ? undefined : gt(broadcasts.id, since))
      .orderBy(desc(broadcasts.id));

    // With since, return every newer row. A limit would keep only the newest
    // ones, and a client that moves since past them would never get the rest.
    return since === undefined ? query.limit(limit) : query;
  }),

  // Transactional outbox: the INSERT is the source of truth and the Realtime
  // push is best-effort. Rows left with published_at = NULL are for a retry
  // relay to pick up (not built yet).
  send: protectedProcedure
    .input(sendInputSchema)
    .mutation(async ({ input, ctx }) => {
      // An auth account may not be linked to a users row yet. Send anyway,
      // with no sender.
      const [sender] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.authUserId, ctx.user.id))
        .limit(1);
      const senderName = sender?.name ?? null;

      const [inserted] = await db
        .insert(broadcasts)
        .values({ ...input, createdBy: sender?.id ?? null })
        .returning();
      // Same shape as list, so clients can render the toast without a lookup.
      const row = { ...inserted, senderName };

      let published = true;
      try {
        await publishBroadcast({
          topic: BROADCAST_TOPIC,
          event: BROADCAST_NEW_EVENT,
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
        return { ...updatedRow, senderName };
      } catch (error) {
        console.error(
          `Failed to record publish result for broadcast ${row.id}:`,
          error,
        );
        return row;
      }
    }),
});
