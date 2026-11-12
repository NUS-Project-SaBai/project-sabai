// @vitest-environment node
//
// Integration tests for the broadcasts tRPC router against the local
// Postgres instance configured in .env.
// Covers list (ordering, limits, since filtering) and send (outbox publish
// success/failure, sender name, input validation), plus authentication checks.
// publishBroadcast is mocked, so Supabase Realtime is not needed.
// Prereqs: local Supabase running with migrations applied.
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
import { eq, inArray } from "drizzle-orm";

import { broadcasts } from "@/db/schema";
import { db } from "@/db/drizzle";
import { appRouter } from "@/server/routers/_app";
import type { Context } from "@/server/context";

// Stub the Realtime push so tests don't depend on Supabase Realtime.
const { publishBroadcastMock } = vi.hoisted(() => ({
  publishBroadcastMock: vi.fn(),
}));
vi.mock("@/server/utils/realtime", () => ({
  publishBroadcast: publishBroadcastMock,
}));

// Creates an authenticated request
const caller = appRouter.createCaller({
  user: { id: "broadcasts-test-user" },
} as unknown as Context);

const unauthenticatedCaller = appRouter.createCaller({
  user: null,
} as unknown as Context);

describe("broadcastsRouter.list (integration)", () => {
  let fixtureIds: number[] = [];

  beforeAll(async () => {
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

  it.each([0, 201, 1.5])("rejects invalid limit %s", async (limit) => {
    await expect(caller.broadcastsRouter.list({ limit })).rejects.toMatchObject(
      {
        code: "BAD_REQUEST",
      },
    );
  });
});

describe("broadcastsRouter.send (integration)", () => {
  const senderCaller = appRouter.createCaller({
    user: {
      id: "broadcasts-send-test-user",
      email: "sender@example.com",
      user_metadata: { display_name: "Test Sender" },
    },
  } as unknown as Context);

  const validInput = {
    title: "Paracetamol low in stock",
    body: "Pharmacy has fewer than 50 paracetamol 500mg tablets left. Please avoid prescribing paracetamol unless necessary and consider alternatives until restocked.",
    severity: "warning",
  } as const;

  const createdIds: number[] = [];

  afterEach(() => {
    publishBroadcastMock.mockReset();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.delete(broadcasts).where(inArray(broadcasts.id, createdIds));
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
      createdBy: "Test Sender",
      attempts: 0,
    });
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(await findRow(result.id)).toEqual(result);

    // The pushed payload is the committed row, before it was marked published.
    expect(publishBroadcastMock).toHaveBeenCalledWith({
      topic: "notifications",
      event: "new",
      payload: expect.objectContaining({
        id: result.id,
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
    expect(await findRow(result.id)).toEqual(result);
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

  it("falls back to the sender's email when there is no display name", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);
    const emailOnlyCaller = appRouter.createCaller({
      user: {
        id: "broadcasts-send-email-user",
        email: "fallback@example.com",
        user_metadata: {},
      },
    } as unknown as Context);

    const result = await emailOnlyCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result.createdBy).toBe("fallback@example.com");
  });

  it("truncates a display name longer than the created_by column", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);
    const longNameCaller = appRouter.createCaller({
      user: {
        id: "broadcasts-send-long-name-user",
        email: "long-name@example.com",
        user_metadata: { display_name: "a".repeat(300) },
      },
    } as unknown as Context);

    const result = await longNameCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result.createdBy).toBe("a".repeat(255));
  });

  it("stores no sender when there is no display name or email", async () => {
    publishBroadcastMock.mockResolvedValue(undefined);
    const anonymousCaller = appRouter.createCaller({
      user: {
        id: "broadcasts-send-no-name-user",
        user_metadata: { display_name: "  " },
      },
    } as unknown as Context);

    const result = await anonymousCaller.broadcastsRouter.send(validInput);
    createdIds.push(result.id);

    expect(result.createdBy).toBeNull();
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
