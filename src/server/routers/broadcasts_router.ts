import { desc, gt } from "drizzle-orm";
import { z } from "zod";

import { broadcasts } from "@/db/schema";
import { db } from "@/db/drizzle";
import { protectedProcedure, router } from "@/server/trpc";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const listInputSchema = z
  .object({
    limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    since: z.number().int().optional(),
  })
  .optional();

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
});
