// @vitest-environment node
//
// Integration tests for the broadcasts tRPC router against the local
// Postgres instance configured in .env.
// Covers ordering, limits, since filtering, and authentication checks.
// Prereqs: local Supabase running with migrations applied.
//
// Runs in Node because envVariables.ts only exposes DATABASE_URL server-side.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";

import { broadcasts } from "@/db/schema";
import { db } from "@/db/drizzle";
import { appRouter } from "@/server/routers/_app";
import type { Context } from "@/server/context";
import { getLinkedTestUser } from "./testUsers";

function callerFor(authUserId: string) {
  return appRouter.createCaller({
    user: { id: authUserId },
  } as unknown as Context);
}

// Authenticated caller, set up in beforeAll with a login linked to public.users
let caller: ReturnType<typeof callerFor>;

const unauthenticatedCaller = appRouter.createCaller({
  user: null,
} as unknown as Context);

describe("broadcastsRouter.list (integration)", () => {
  let fixtureIds: number[] = [];

  beforeAll(async () => {
    caller = callerFor((await getLinkedTestUser()).authUserId);

    // Create more than 50 rows to test default limit behaviour
    const inserted = await db
      .insert(broadcasts)
      .values(
        Array.from({ length: 51 }, (_, index) => ({
          title: `Broadcast list test ${index}`,
          body: "Temporary integration test broadcast",
        })),
      )
      .returning({ id: broadcasts.id });

    fixtureIds = inserted.map(({ id }) => id).sort((a, b) => a - b);
  });

  // Clean up the test rows after the tests are done
  afterAll(async () => {
    if (fixtureIds.length > 0) {
      await db.delete(broadcasts).where(inArray(broadcasts.id, fixtureIds));
    }
  });

  it("returns broadcasts newest first", async () => {
    const rows = await caller.broadcastsRouter.list({
      limit: 200,
      since: fixtureIds[0] - 1,
    });

    expect(rows.map(({ id }) => id)).toEqual([...fixtureIds].reverse());
  });

  it("returns broadcasts up to the requested limit", async () => {
    const rows = await caller.broadcastsRouter.list({
      limit: 5,
      since: fixtureIds[0] - 1,
    });

    expect(rows.map(({ id }) => id)).toEqual(
      [...fixtureIds].reverse().slice(0, 5),
    );
  });

  it("defaults to 50 rows when no input is provided", async () => {
    const rows = await caller.broadcastsRouter.list();

    expect(rows.map(({ id }) => id)).toEqual(
      [...fixtureIds].reverse().slice(0, 50),
    );
  });

  it("defaults to 50 rows when limit is omitted", async () => {
    const rows = await caller.broadcastsRouter.list({
      since: fixtureIds[0] - 1,
    });

    expect(rows.map(({ id }) => id)).toEqual(
      [...fixtureIds].reverse().slice(0, 50),
    );
  });

  it("returns only rows with IDs greater than since", async () => {
    const since = fixtureIds[25];

    const rows = await caller.broadcastsRouter.list({
      limit: 200,
      since,
    });

    const expectedIds = fixtureIds.filter((id) => id > since).reverse();

    expect(rows.map(({ id }) => id)).toEqual(expectedIds);
  });

  it("rejects unauthenticated callers", async () => {
    await expect(
      unauthenticatedCaller.broadcastsRouter.list(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects logins that are not linked to a user", async () => {
    await expect(
      callerFor(randomUUID()).broadcastsRouter.list(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it.each([0, 201, 1.5])("rejects invalid limit %s", async (limit) => {
    await expect(caller.broadcastsRouter.list({ limit })).rejects.toMatchObject(
      {
        code: "BAD_REQUEST",
      },
    );
  });
});
