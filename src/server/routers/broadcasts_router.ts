import { desc, gt } from "drizzle-orm";
import { z } from "zod";

import { broadcasts } from "@/db/schema";
import { db } from "@/db/drizzle";
import { protectedProcedure, router } from "@/server/trpc";

const listInputSchema = z
  .object({
    limit: z.number().int().min(1).max(200).default(50),
    since: z.number().int().optional(),
  })
  .optional();

export const broadcastsRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const limit = input?.limit ?? 50;
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
