import { CONSULT_EDIT_WINDOW_MS } from "@/lib/constants/consults";

/**
 * Whether a consult created at `createdAt` can still be edited. Shared by the
 * consults router (which enforces it) and the UI (which disables Edit).
 */
export function isWithinConsultEditWindow(
  createdAt: Date | string,
  now: number = Date.now(),
): boolean {
  return now - new Date(createdAt).getTime() <= CONSULT_EDIT_WINDOW_MS;
}
