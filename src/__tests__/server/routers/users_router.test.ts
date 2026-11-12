// @vitest-environment node
//
// Integration tests for the users tRPC router, run against the Postgres
// instance configured in .env.
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied, and
// at least one login linked to public.users (`pnpm seed:users`).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import type { Context } from "@/server/context";
import { users } from "@/db/schema";
import { getLinkedTestUser } from "./testUsers";

describe("usersRouter (integration)", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let pnUserId: string;

  beforeAll(async () => {
    const { authUserId } = await getLinkedTestUser();
    // protectedProcedure only reads ctx.user, so a minimal context is enough.
    caller = appRouter.createCaller({
      user: { id: authUserId },
    } as unknown as Context);

    [{ id: pnUserId }] = await db
      .insert(users)
      .values({ name: "Users Router Test PN", team: "PN", role: "Member" })
      .returning({ id: users.id });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, pnUserId));
  });

  describe("list()", () => {
    it("returns each user's id, name and team only", async () => {
      // When - users are listed
      const result = await caller.usersRouter.list();
      // Then - the PN user is included with only the picker fields
      expect(result).toContainEqual({
        id: pnUserId,
        name: "Users Router Test PN",
        team: "PN",
      });
      expect(Object.keys(result[0]).sort()).toEqual(["id", "name", "team"]);
    });
  });
});
