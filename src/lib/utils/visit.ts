/**
 * Formats a visit date into a readable string in GB locale,
 * e.g. "22 June 2026, 14:30".
 *
 * @param {Date} date - The date to format.
 * @returns {string} Formatted date string in GB locale.
 */
export function formatVisitDate(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
