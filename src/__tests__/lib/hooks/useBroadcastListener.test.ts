import { renderHook, waitFor } from "@testing-library/react";
import { supabase } from "@/lib/supabaseClient";
import { useBroadcastListener } from "@/lib/hooks/useBroadcastListener";
import type { BroadcastNotification } from "@/lib/validation/broadcasts";

type BroadcastHandler = (message: { payload: unknown }) => void;
type StatusHandler = (status: string, error?: Error) => void;

// A fake Realtime channel that records its handlers so tests can drive them.
const fakeChannel = {
  broadcastHandler: undefined as BroadcastHandler | undefined,
  statusHandler: undefined as StatusHandler | undefined,
  on: vi.fn(),
  subscribe: vi.fn(),
};

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    realtime: { setAuth: vi.fn() },
    channel: vi.fn(),
    getChannels: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase = supabase as any;

const BROADCAST: BroadcastNotification = {
  id: 7,
  title: "Clinic closes early",
  body: "Pack up by 3pm.",
  severity: "warning",
  senderName: "Dr Lim",
};

function renderListener(
  props: Partial<Parameters<typeof useBroadcastListener>[0]> = {},
) {
  const onBroadcast = vi.fn();
  const view = renderHook((hookProps) => useBroadcastListener(hookProps), {
    initialProps: {
      accessToken: "token-1" as string | null,
      onBroadcast,
      ...props,
    },
  });
  return { ...view, onBroadcast };
}

describe("useBroadcastListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeChannel.broadcastHandler = undefined;
    fakeChannel.statusHandler = undefined;
    mockSupabase.realtime.setAuth.mockResolvedValue(undefined);
    mockSupabase.channel.mockReturnValue(fakeChannel);
    mockSupabase.getChannels.mockReturnValue([]);
    mockSupabase.removeChannel.mockResolvedValue("ok");
    fakeChannel.on.mockImplementation(
      (_type: string, _filter: unknown, handler: BroadcastHandler) => {
        fakeChannel.broadcastHandler = handler;
        return fakeChannel;
      },
    );
    fakeChannel.subscribe.mockImplementation((handler: StatusHandler) => {
      fakeChannel.statusHandler = handler;
      return fakeChannel;
    });
  });

  it("opens no channel without an access token", async () => {
    renderListener({ accessToken: null });

    await Promise.resolve();
    expect(mockSupabase.realtime.setAuth).not.toHaveBeenCalled();
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it("sets auth before joining the private notifications channel", async () => {
    renderListener();

    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());
    expect(mockSupabase.realtime.setAuth).toHaveBeenCalledWith("token-1");
    expect(
      mockSupabase.realtime.setAuth.mock.invocationCallOrder[0],
    ).toBeLessThan(mockSupabase.channel.mock.invocationCallOrder[0]);
    expect(mockSupabase.channel).toHaveBeenCalledWith("notifications", {
      config: { private: true },
    });
    expect(fakeChannel.on).toHaveBeenCalledWith(
      "broadcast",
      { event: "new" },
      expect.any(Function),
    );
  });

  it("forwards new broadcasts", async () => {
    const { onBroadcast } = renderListener();
    await waitFor(() => expect(fakeChannel.broadcastHandler).toBeDefined());

    fakeChannel.broadcastHandler!({ payload: BROADCAST });

    expect(onBroadcast).toHaveBeenCalledTimes(1);
    expect(onBroadcast).toHaveBeenCalledWith(BROADCAST);
  });

  it("strips fields the client does not use", async () => {
    const { onBroadcast } = renderListener();
    await waitFor(() => expect(fakeChannel.broadcastHandler).toBeDefined());

    fakeChannel.broadcastHandler!({
      payload: { ...BROADCAST, createdAt: "2026-11-20T00:00:00Z", attempts: 0 },
    });

    expect(onBroadcast).toHaveBeenCalledWith(BROADCAST);
  });

  it.each([
    ["a non-object", "hello"],
    ["a missing id", { ...BROADCAST, id: undefined }],
    ["an unknown severity", { ...BROADCAST, severity: "panic" }],
  ])("drops a payload with %s", async (_case, payload) => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { onBroadcast } = renderListener();
    await waitFor(() => expect(fakeChannel.broadcastHandler).toBeDefined());

    fakeChannel.broadcastHandler!({ payload });

    expect(onBroadcast).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it.each(["CHANNEL_ERROR", "TIMED_OUT"])("logs %s", async (status) => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderListener();
    await waitFor(() => expect(fakeChannel.statusHandler).toBeDefined());

    fakeChannel.statusHandler!(status, new Error("join failed"));

    expect(errorSpy).toHaveBeenCalledWith(
      `Notifications channel ${status}:`,
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("keeps one channel across a token refresh and new callbacks", async () => {
    const { rerender, onBroadcast } = renderListener();
    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalledTimes(1));

    const newOnBroadcast = vi.fn();
    rerender({
      accessToken: "token-2",
      onBroadcast: newOnBroadcast,
    });
    fakeChannel.broadcastHandler!({ payload: BROADCAST });

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    expect(mockSupabase.removeChannel).not.toHaveBeenCalled();
    // The live channel uses the latest callback, not the one it was created with.
    expect(newOnBroadcast).toHaveBeenCalledWith(BROADCAST);
    expect(onBroadcast).not.toHaveBeenCalled();
  });

  it("removes the channel on sign-out and on unmount", async () => {
    const { rerender, unmount, onBroadcast } = renderListener();
    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalledTimes(1));

    rerender({ accessToken: null, onBroadcast });
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(fakeChannel);

    rerender({ accessToken: "token-3", onBroadcast });
    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalledTimes(2));

    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2);
  });

  it("removes a leftover channel on the same topic before joining", async () => {
    const leftover = { topic: "realtime:notifications" };
    mockSupabase.getChannels.mockReturnValue([leftover]);
    renderListener();

    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(leftover);
    expect(mockSupabase.removeChannel.mock.invocationCallOrder[0]).toBeLessThan(
      mockSupabase.channel.mock.invocationCallOrder[0],
    );
  });

  it("logs and does not join when setAuth fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase.realtime.setAuth.mockRejectedValue(new Error("bad token"));
    renderListener();

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to prepare the notifications channel:",
        expect.any(Error),
      ),
    );
    expect(mockSupabase.channel).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not join if unmounted before setAuth resolves", async () => {
    let resolveAuth: () => void = () => {};
    mockSupabase.realtime.setAuth.mockReturnValue(
      new Promise<void>((resolve) => (resolveAuth = resolve)),
    );
    const { unmount } = renderListener();

    unmount();
    resolveAuth();
    // Wait until the hook has finished its async setup, i.e. reached the
    // point where it would join, before checking that it didn't.
    await waitFor(() => expect(mockSupabase.getChannels).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});
