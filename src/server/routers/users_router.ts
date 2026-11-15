import { asc } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { router, protectedProcedure } from "@/server/trpc";
import { users } from "@/db/schema";

export const usersRouter = router({
  // All app users ordered by name, for member pickers. Pickers filter by team
  // on the client so a member who changed team can still be shown on records
  // that already reference them.
  list: protectedProcedure.query(async () => {
    return await db
      .select({ id: users.id, name: users.name, team: users.team })
      .from(users)
      .orderBy(asc(users.name));
  }),
});
