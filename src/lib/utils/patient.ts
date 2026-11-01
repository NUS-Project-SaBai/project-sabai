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

/**
 * Decides whether a patient should show up for the text typed in the patient search.
 *
 * Name and identification number are matched as case-insensitive substrings. The
 * displayed patient code (e.g. "PC0012", or just "0012" with no village) is matched
 * the same way, but only when the text contains a digit, so letters-only text such
 * as "ca" doesn't pull in every patient from a village with that code.
 */
export function matchesPatientSearch(
  patient: {
    id: number;
    name: string;
    identificationNumber: string | null;
    villageCode: string | null;
  },
  searchText: string,
) {
  const query = searchText.trim().toLowerCase();

  if (!query) {
    return false;
  }

  if (patient.name.toLowerCase().includes(query)) {
    return true;
  }

  if (patient.identificationNumber?.toLowerCase().includes(query)) {
    return true;
  }

  return (
    /\d/.test(query) &&
    formatPatientCode(patient.villageCode, patient.id)
      .toLowerCase()
      .includes(query)
  );
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
 * Formats a Date/ISO value into the yyyy-MM-dd string a native date input expects.
 * Returns an empty string for invalid dates.
 */
export function toDateInputValue(dateOfBirth: Date | string) {
  const date = new Date(dateOfBirth);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
