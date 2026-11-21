import toast from "react-hot-toast";
import type { BroadcastNotification } from "@/lib/validation/broadcasts";

// How long each severity stays on screen (default when unset).
const TOAST_DURATION_MS: Partial<
  Record<BroadcastNotification["severity"], number>
> = {
  warning: 8000,
  // Critical stays until dismissed so it can't be missed.
  critical: Infinity,
};

export function showBroadcastToast(broadcast: BroadcastNotification) {
  toast(
    (t) => (
      // react-hot-toast centres message text; broadcasts read better left-aligned.
      <div className="flex w-full items-start gap-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-text-muted">
            {broadcast.severity}
          </p>
          <p className="font-semibold">{broadcast.title}</p>
          <p className="line-clamp-3 text-sm whitespace-pre-line">
            {broadcast.body}
          </p>
          {broadcast.senderName && (
            <p className="mt-1 text-xs text-text-muted">
              From {broadcast.senderName}
            </p>
          )}
        </div>
        {broadcast.severity === "critical" && (
          <button
            type="button"
            aria-label="Dismiss notification"
            className="text-text-muted hover:cursor-pointer hover:text-text"
            onClick={() => toast.dismiss(t.id)}
          >
            ×
          </button>
        )}
      </div>
    ),
    {
      id: `broadcast-${broadcast.id}`,
      className: `broadcast-toast-${broadcast.severity}`,
      duration: TOAST_DURATION_MS[broadcast.severity],
      // react-hot-toast sizes toasts to their text and caps them at 350px.
      // Use one fixed width so every broadcast is easy to read, keeping a 16px
      // gutter on each side on phones.
      style: {
        width: "min(32rem, calc(100vw - 2rem))",
        maxWidth: "none",
      },
    },
  );
}
