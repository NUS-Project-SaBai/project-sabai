import type { Broadcast } from "@/db/schema/broadcasts";
import {
  BROADCAST_NEW_EVENT,
  BROADCAST_TOPIC,
} from "@/lib/constants/broadcasts";
import envVariables from "@/lib/envVariables";

// Fail fast so a hung Realtime call doesn't hold the request open.
const PUBLISH_TIMEOUT_MS = 5000;

// Includes the sender's name so clients can render the toast without a lookup.
type BroadcastPayload = Broadcast & { senderName: string | null };

// Add another object variant with `|` when a new topic/event contract is introduced.
type PublishBroadcastParams = {
  topic: typeof BROADCAST_TOPIC;
  event: typeof BROADCAST_NEW_EVENT;
  payload: BroadcastPayload;
};

export async function publishBroadcast({
  topic,
  event,
  payload,
}: PublishBroadcastParams): Promise<void> {
  const response = await fetch(
    `${envVariables.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
    {
      method: "POST",
      headers: {
        apikey: envVariables.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${envVariables.SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic,
            event,
            payload,
            // A private broadcast must match the private channel used by subscribers.
            private: true,
          },
        ],
      }),
      signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();

    // Include Supabase's response so the outbox worker can log a useful failure.
    throw new Error(
      `Failed to publish broadcast (${response.status}): ${responseText}`,
    );
  }
}
