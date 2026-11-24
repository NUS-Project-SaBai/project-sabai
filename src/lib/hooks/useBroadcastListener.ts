import { useEffect, useEffectEvent } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  BROADCAST_NEW_EVENT,
  BROADCAST_TOPIC,
} from "@/lib/constants/broadcasts";
import { supabase } from "@/lib/supabaseClient";
import {
  broadcastNotificationSchema,
  type BroadcastNotification,
} from "@/lib/validation/broadcasts";

interface UseBroadcastListenerOptions {
  /** Token of the signed-in user. No channel is opened while this is null. */
  accessToken: string | null;
  /** Called for every valid `new` broadcast. */
  onBroadcast: (broadcast: BroadcastNotification) => void;
}

/**
 * Subscribes to the private `notifications` Realtime channel while a user is
 * signed in, and removes the channel on sign-out or unmount.
 */
export function useBroadcastListener({
  accessToken,
  onBroadcast,
}: UseBroadcastListenerOptions) {
  // Realtime payloads are network input: validate before passing them on.
  const handleBroadcast = useEffectEvent((rawPayload: unknown) => {
    const parsed = broadcastNotificationSchema.safeParse(rawPayload);
    if (!parsed.success) {
      console.error("Ignoring invalid broadcast payload:", parsed.error);
      return;
    }
    onBroadcast(parsed.data);
  });
  const getAccessToken = useEffectEvent(() => accessToken);

  const enabled = accessToken !== null;

  // Keyed on `enabled` only, so a refreshed token or new callback doesn't
  // remove and re-add the channel.
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      try {
        // supabase-js calls realtime.setAuth itself on TOKEN_REFRESHED, so the
        // token only needs setting once here.
        await supabase.realtime.setAuth(getAccessToken());
        // channel() hands back an existing channel with the same topic, and a
        // removed channel lingers until its leave finishes (slow on bad wifi).
        // Subscribing to that leftover silently does nothing, so remove it.
        await Promise.all(
          supabase
            .getChannels()
            .filter(
              (leftover) => leftover.topic === `realtime:${BROADCAST_TOPIC}`,
            )
            .map((leftover) => supabase.removeChannel(leftover)),
        );
      } catch (error) {
        console.error("Failed to prepare the notifications channel:", error);
        return;
      }
      if (cancelled) return;

      channel = supabase
        .channel(BROADCAST_TOPIC, { config: { private: true } })
        .on("broadcast", { event: BROADCAST_NEW_EVENT }, ({ payload }) =>
          handleBroadcast(payload),
        )
        .subscribe((status, error) => {
          // supabase-js retries on its own; this is the only trace of why
          // broadcasts are not arriving.
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`Notifications channel ${status}:`, error);
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled]);
}
