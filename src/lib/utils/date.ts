function hasInvalidIsoDay(value: Date | string) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  return (
    !!match && parseDateInput(`${match[3]}/${match[2]}/${match[1]}`) === null
  );
}

/** DOB values use their UTC calendar day; pass timeZone: null for runtime local time. */
export function formatDate(
  value: Date | string | null | undefined,
  options: { timeZone?: string | null } = {},
) {
  if (value == null || (typeof value === "string" && !value.trim()))
    return "Not provided";
  if (hasInvalidIsoDay(value)) return "Invalid date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone:
      options.timeZone === null ? undefined : (options.timeZone ?? "UTC"),
  })
    .formatToParts(date)
    .map((part) =>
      part.type === "year" ? part.value.padStart(4, "0") : part.value,
    )
    .join("");
}

/** Convert a Date/ISO timestamp to its UTC calendar day (yyyy-MM-dd), or "" if invalid. */
export function toDateInputValue(value: Date | string | null | undefined) {
  if (value == null || (typeof value === "string" && !value.trim())) return "";
  if (hasInvalidIsoDay(value)) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** Strictly parse a calendar date, without interpreting it as a timestamp. */
export function parseDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText),
    month = Number(monthText),
    year = Number(yearText);
  if (year < 1 || month < 1 || month > 12) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > days[month - 1]) return null;
  return `${yearText}-${monthText}-${dayText}`;
}

/** Today's local calendar day as yyyy-MM-dd, comparable with parseDateInput output. */
export function todayIso() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True when a yyyy-MM-dd day (e.g. from parseDateInput) is after today, local time. */
export function isFutureDate(iso: string) {
  // Zero-padded yyyy-MM-dd strings sort chronologically.
  return iso > todayIso();
}
