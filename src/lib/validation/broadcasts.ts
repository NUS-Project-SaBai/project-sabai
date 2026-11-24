import { z } from "zod";
import {
  BROADCAST_BODY_MAX_LENGTH,
  BROADCAST_SEVERITIES,
  BROADCAST_TITLE_MAX_LENGTH,
} from "@/lib/constants/broadcasts";

/**
 * Input of `broadcasts.send`. Shared by the router and the compose form on
 * /notifications so both apply the same rules.
 */
export const sendBroadcastSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Please enter a title.")
    .max(
      BROADCAST_TITLE_MAX_LENGTH,
      `Title must be ${BROADCAST_TITLE_MAX_LENGTH} characters or fewer.`,
    ),
  body: z
    .string()
    .trim()
    .min(1, "Please enter a message.")
    .max(
      BROADCAST_BODY_MAX_LENGTH,
      `Message must be ${BROADCAST_BODY_MAX_LENGTH} characters or fewer.`,
    ),
  severity: z.enum(BROADCAST_SEVERITIES).default("info"),
});

export type SendBroadcastInput = z.input<typeof sendBroadcastSchema>;

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
