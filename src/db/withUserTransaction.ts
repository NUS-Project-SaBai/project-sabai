import type { PgTransaction } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema/index";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";

export type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Executes a Drizzle transaction attributed to a user.
 * Sets `app.current_user_id` for the transaction, which `get_current_user_id()`
 * reads inside Postgres triggers (e.g. the medication stock audit log).
 *
 * @param userId The public.users id (`ctx.appUser.id`), NOT the Supabase auth user id.
 */
export async function withUserTransaction<T>(
  userId: string,
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
    );

    return await callback(tx);
  });
}
