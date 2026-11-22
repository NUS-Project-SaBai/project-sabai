// @vitest-environment node
//
// Integration tests for the broadcasts tRPC router against the local
// Postgres instance configured in .env.
// Covers list (ordering, limits, since filtering) and send (outbox publish
// success/failure, sender lookup, input validation), plus authentication checks.
// publishBroadcast is mocked, so Supabase Realtime is not needed.
// Prereqs: local Supabase running with migrations applied and seeded
// (`pnpm seed:all`) so that an auth.users row exists.
//
// Runs in Node because envVariables.ts only exposes DATABASE_URL server-side.

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";

import { authUsers, broadcasts, users } from "@/db/schema";
import { db } from "@/db/drizzle";
import { appRouter } from "@/server/routers/_app";
import type { Context } from "@/server/context";
import { getLinkedTestUser } from "./testUsers";

// Stub the Realtime push so tests don't depend on Supabase Realtime.
const { publishBroadcastMock } = vi.hoisted(() => ({
  publishBroadcastMock: vi.fn(),
}));
vi.mock("@/server/utils/realtime", () => ({
  publishBroadcast: publishBroadcastMock,
}));

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

  it("ignores the limit when since is given", async () => {
    const rows = await caller.broadcastsRouter.list({
      limit: 5,
      since: fixtureIds[0] - 1,
    });

    expect(rows.map(({ id }) => id)).toEqual([...fixtureIds].reverse());
  });

  it("defaults to 50 rows when no input is provided", async () => {
    const rows = await caller.broadcastsRouter.list();

    expect(rows.map(({ id }) => id)).toEqual(
      [...fixtureIds].reverse().slice(0, 50),
    );
  });

  it("defaults to 50 rows when limit is omitted", async () => {
    const rows = await caller.broadcastsRouter.list({});

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

describe("broadcastsRouter.send (integration)", () => {
  let sender: { id: string; name: string };
  let createdUserId: string | undefined;
  let senderCaller: ReturnType<typeof appRouter.createCaller>;

  const validInput = {
    title: "Paracetamol low in stock",
    body: "Pharmacy has fewer than 50 paracetamol 500mg tablets left. Please avoid prescribing paracetamol unless necessary and consider alternatives until restocked.",
    severity: "warning",
  } as const;

  const createdIds: number[] = [];

  beforeAll(async () => {
    const [authUser] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .limit(1);
    if (!authUser) {
      throw new Error(
        "No auth.users row found. Run `pnpm seed:all` against local Supabase " +
          "before running the router integration tests.",
      );
    }

    // Reuse the users row linked to this account, or create one.
    [sender] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.authUserId, authUser.id));
    if (!sender) {
      [sender] = await db
        .insert(users)
        .values({ name: "Broadcast Test Sender", authUserId: authUser.id })
        .returning({ id: users.id, name: users.name });
      createdUserId = sender.id;
    }

    senderCaller = appRouter.createCaller({
      user: { id: authUser.id },
    } as unknown as Context);
  });

  afterEach(() => {
    publishBroadcastMock.mockReset();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.delete(broadcasts).where(inArray(broadcasts.id, createdIds));
    }
    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId));
    }
  });

  async function findRow(id: number) {
    const [row] = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, id));
    return row;
  }

  it("saves the row and marks it published when the push succeeds", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);

    const result = await senderCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result).toMatchObject({
      ...validInput,
      createdBy: sender.id,
      senderName: sender.name,
      attempts: 0,
    });
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result).toMatchObject(await findRow(result.id));

    // The pushed payload is the committed row, before it was marked published.
    expect(publishBroadcastMock).toHaveBeenCalledWith({
      topic: "notifications",
      event: "new",
      payload: expect.objectContaining({
        id: result.id,
        senderName: sender.name,
        publishedAt: null,
        attempts: 0,
      }),
    });
  });

  it("keeps the row unpublished and counts the attempt when the push fails", async () => {
    publishBroadcastMock.mockRejectedValue(new Error("realtime down"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await senderCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result).toMatchObject({
      ...validInput,
      publishedAt: null,
      attempts: 1,
    });
    expect(result).toMatchObject(await findRow(result.id));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("defaults severity to info", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);

    const result = await senderCaller.broadcastsRouter.send({
      title: "Lunch break",
      body: "Consultations will pause from 12:00 to 13:00. Registration remains open.",
    });
    createdIds.push(result.id);

    expect(result.severity).toBe("info");
  });

  it("rejects sending from an account with no linked users row", async () => {
    await expect(
      callerFor(randomUUID()).broadcastsRouter.send(validInput),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(publishBroadcastMock).not.toHaveBeenCalled();
  });

  it("lists the sender name by joining users", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);

    const result = await senderCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    const [listed] = await senderCaller.broadcastsRouter.list({
      since: result.id - 1,
    });
    expect(listed).toEqual(result);
  });

  it("blocks deleting a user who has sent broadcasts", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Broadcast Restrict Test" })
      .returning({ id: users.id });
    const [row] = await db
      .insert(broadcasts)
      .values({ ...validInput, createdBy: user.id })
      .returning({ id: broadcasts.id });

    try {
      await expect(
        db.delete(users).where(eq(users.id, user.id)),
      ).rejects.toThrow();
    } finally {
      await db.delete(broadcasts).where(eq(broadcasts.id, row.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });

  it("returns the saved row when marking it published fails", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(db, "update").mockImplementationOnce(() => {
      throw new Error("connection reset");
    });

    const result = await senderCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result).toMatchObject({ ...validInput, publishedAt: null });
    expect(await findRow(result.id)).toBeDefined();
  });

  it.each([
    ["empty title", { ...validInput, title: "" }],
    ["whitespace-only title", { ...validInput, title: "   " }],
    ["title over 255 characters", { ...validInput, title: "a".repeat(256) }],
    ["empty body", { ...validInput, body: "" }],
    ["whitespace-only body", { ...validInput, body: "   " }],
    ["body over 5000 characters", { ...validInput, body: "a".repeat(5001) }],
    ["unknown severity", { ...validInput, severity: "urgent" }],
  ])("rejects %s", async (_, input) => {
    await expect(
      senderCaller.broadcastsRouter.send(
        input as Parameters<typeof senderCaller.broadcastsRouter.send>[0],
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(publishBroadcastMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    await expect(
      unauthenticatedCaller.broadcastsRouter.send(validInput),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(publishBroadcastMock).not.toHaveBeenCalled();
  });
});
