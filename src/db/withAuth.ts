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
 * Executes a Drizzle transaction with the user's Supabase ID attached.
 * This populates Supabase's `auth.uid()` inside Postgres triggers.
 */
export async function withUserAuth<T>(
  userId: string,
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`,
    );

    return await callback(tx);
  });
}
