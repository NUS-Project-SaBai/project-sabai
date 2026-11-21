// Also the values of the broadcast_severity Postgres enum.
export const BROADCAST_SEVERITIES = ["info", "warning", "critical"] as const;

export const BROADCAST_TITLE_MAX_LENGTH = 255;
// Keeps every broadcast far below Supabase Realtime's payload limit.
export const BROADCAST_BODY_MAX_LENGTH = 5000;

export const BROADCAST_LIST_DEFAULT_LIMIT = 50;
export const BROADCAST_LIST_MAX_LIMIT = 200;

// Realtime channel contract shared by publishBroadcast (server) and
// useBroadcastListener (client). The RLS policy in
// supabase/migrations/0019_notifications_realtime_select_policy.sql also
// names this topic.
export const BROADCAST_TOPIC = "notifications";
export const BROADCAST_NEW_EVENT = "new";
