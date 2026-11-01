/**
 * Pads a patient ID to at least four digits, e.g. 12 → "0012".
 */
export function formatPatientId(id: number) {
  return id.toString().padStart(4, "0");
}

/**
 * Prefixes the padded ID with the village code when available, e.g. "PC0012".
 */
export function formatPatientCode(villageCode: string | null, id: number) {
  return `${villageCode ?? ""}${formatPatientId(id)}`;
}

export function calculateAge(dateOfBirth: Date) {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDifference = now.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

/**
 * Returns the yyyy-MM-dd date input value, or an empty string for invalid dates.
 */
export function toDateInputValue(dateOfBirth: Date | string) {
  const date = new Date(dateOfBirth);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
