import { z } from "zod";
import { BROADCAST_SEVERITIES } from "@/lib/constants/broadcasts";

/**
 * The fields of a Realtime `new` broadcast the client uses. The server sends
 * the whole row; dates arrive as strings and are not needed, so unknown keys
 * are stripped.
 */
export const broadcastNotificationSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  severity: z.enum(BROADCAST_SEVERITIES),
  senderName: z.string().nullable(),
});

export type BroadcastNotification = z.infer<typeof broadcastNotificationSchema>;
