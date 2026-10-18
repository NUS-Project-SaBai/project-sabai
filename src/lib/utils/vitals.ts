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
 * Formats systolic/diastolic readings as "120 / 80", using a dash for an
 * individually missing value. When both are missing, returns a single "-" so it
 * matches the placeholder used for every other empty vital.
 */
export function formatBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string {
  if (systolic == null && diastolic == null) return "-";
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

/**
 * Blood pressure thresholds to categorise readings.
 */
export const BP_THRESHOLDS = {
  preHypertension: { systolic: 130, diastolic: 80 },
  hypertension: { systolic: 140, diastolic: 90 },
} as const;

export type BloodPressureStatus = "Pre-HTN" | "HTN" | null;

/**
 * Reads systolic/diastolic readings and classifies the readings into either
 * "Pre-HTN", "HTN" if abnormal readings found. Returns null when neither threshold
 * is reached.
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
): BloodPressureStatus {
  if (
    systolic >= BP_THRESHOLDS.hypertension.systolic ||
    diastolic >= BP_THRESHOLDS.hypertension.diastolic
  ) {
    return "HTN";
  }

  if (
    systolic >= BP_THRESHOLDS.preHypertension.systolic ||
    diastolic >= BP_THRESHOLDS.preHypertension.diastolic
  ) {
    return "Pre-HTN";
  }

  return null;
}

export function describeBloodPressureThreshold(
  status: BloodPressureStatus,
): string | null {
  if (status === null) return null;

  const { systolic: preSystolic, diastolic: preDiastolic } = BP_THRESHOLDS.preHypertension;
  const { systolic: htnSystolic, diastolic: htnDiastolic } = BP_THRESHOLDS.hypertension;

  if (status === "HTN") {
    return `Flagged when systolic ≥ ${htnSystolic} mmHg or diastolic ≥ ${htnDiastolic} mmHg`;
  }

  return `Flagged when systolic is ≥ ${preSystolic} and < ${htnSystolic} mmHg or diastolic is ≥ ${preDiastolic} and < ${htnDiastolic} mmHg`;
}
