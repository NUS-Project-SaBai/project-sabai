import { isNotNull } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

/**
 * Returns a seeded public.users row that is linked to a login.
 * - userId: the public.users id, which FKs (consults.doctor_id, ...) reference.
 * - authUserId: the Supabase auth user id, which goes in ctx.user.id.
 */
export async function getLinkedTestUser() {
  const [user] = await db
    .select({ id: users.id, authUserId: users.authUserId })
    .from(users)
    .where(isNotNull(users.authUserId))
    .limit(1);

  if (!user?.authUserId) {
    throw new Error(
      "No public.users row linked to a login found. Run `pnpm seed:all` " +
        "against local Supabase before running the router integration tests.",
    );
  }

  return { userId: user.id, authUserId: user.authUserId };
}
