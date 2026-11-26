import { clsx } from "clsx";
import type { BroadcastNotification } from "@/lib/validation/broadcasts";

type Severity = BroadcastNotification["severity"];

const SEVERITY_LABEL: Record<Severity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

// Same colour per severity as the broadcast toast outline.
const SEVERITY_CLASS: Record<Severity, string> = {
  info: "bg-info-subtle text-info ring-info/30",
  warning: "bg-warning-subtle text-warning ring-warning/30",
  critical: "bg-danger-subtle text-danger ring-danger/30",
};

export default function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
        SEVERITY_CLASS[severity],
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
