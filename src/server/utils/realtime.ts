import envVariables from "@/lib/envVariables";

type PublishBroadcastParams = {
  topic: string;
  event: string;
  payload: unknown;
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
