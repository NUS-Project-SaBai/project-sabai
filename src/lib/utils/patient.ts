/**
 * Formats a patient id as a zero-padded, 4-digit string, e.g. 12 → "0012".
 */
export function formatPatientId(id: number) {
  return id.toString().padStart(4, "0");
}

/**
 * Builds the display code for a patient, for example "PC0012". Falls back to the
 * zero-padded id alone when the patient has no village (no visits yet).
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
