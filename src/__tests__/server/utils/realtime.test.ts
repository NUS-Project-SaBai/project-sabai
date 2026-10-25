import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Broadcast } from "@/db/schema/broadcasts";
import { publishBroadcast } from "@/server/utils/realtime";

// Keep this unit test independent of local Supabase credentials.
vi.mock("@/lib/envVariables", () => ({
  default: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_SECRET_KEY: "test-secret-key",
  },
}));

describe("publishBroadcast", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const payload = {
    id: 42,
    title: "Clinic update",
    body: "The clinic schedule has changed.",
    severity: "info",
    createdBy: "Test User",
    createdAt: new Date("2026-10-24T00:00:00.000Z"),
    publishedAt: null,
    attempts: 0,
  } satisfies Broadcast;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("publishes a private broadcast with the correct request", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await publishBroadcast({
      topic: "notifications",
      event: "new",
      payload,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test-project.supabase.co/realtime/v1/api/broadcast",
      {
        method: "POST",
        headers: {
          apikey: "test-secret-key",
          Authorization: "Bearer test-secret-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              topic: "notifications",
              event: "new",
              payload,
              private: true,
            },
          ],
        }),
      },
    );
  });

  it("throws the status and response text for a non-2xx response", async () => {
    fetchMock.mockResolvedValue(
      new Response("service unavailable", { status: 503 }),
    );

    await expect(
      publishBroadcast({
        topic: "notifications",
        event: "new",
        payload,
      }),
    ).rejects.toThrow("Failed to publish broadcast (503): service unavailable");
  });
});
