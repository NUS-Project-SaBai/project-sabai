/**
 * Computes BMI from height (cm) and weight (kg), or an explanatory string when either measurement is missing/invalid.
 * Formula for BMI: weight (kg) / (height (m) * height (m))
 */
export function computeBmi(
  height: string | null,
  weight: string | null,
): string {
  const h = height ? Number(height) : NaN;
  const w = weight ? Number(weight) : NaN;
  if (!h || !w || Number.isNaN(h) || Number.isNaN(w)) {
    return "Invalid/Missing Height or Weight";
  }
  const metres = h / 100;
  return (w / (metres * metres)).toFixed(2);
}

/**
 * Formats systolic/diastolic readings as "120 / 80", using a dash for any missing value.
 */
export function formatBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string {
  return `${systolic ?? "-"} / ${diastolic ?? "-"}`;
}

/**
 * Formats the nullable "diabetes mellitus" tri-state used in the legacy app.
 */
export function formatDiabetes(value: boolean | null): string {
  if (value === null || value === undefined) {
    return "Not Applicable";
  }
  return value ? "Yes" : "No";
}
