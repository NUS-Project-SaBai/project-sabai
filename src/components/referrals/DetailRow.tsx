import { ReactNode } from "react";

/**
 * Label/value row for a description list (`<dl>`) on the referral details page.
 * Stacks on narrow screens and sits side by side from `sm` up.
 */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}
