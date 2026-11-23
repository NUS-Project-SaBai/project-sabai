import type { Dental } from "@/db/schema/dental";

/** Boolean DB columns are held as strings by RHFRadio; "" means unanswered. */
export type BooleanString = "true" | "false";

/** The kind a column must be given, derived from its type in the schema. */
type KindOf<T> = [NonNullable<T>] extends [boolean]
  ? "boolean"
  : string extends NonNullable<T>
    ? "text"
    : "enum";

/**
 * Every single-value `dental` column the form edits, and how it converts
 * between the saved record and the form:
 * - enum: `null` <-> "" (unanswered)
 * - boolean: `true`/`false`/`null` <-> "true"/"false"/""
 * - text: `null` <-> ""; trimmed on save, blank saves as `null`
 *
 * Each kind is checked against the column's type, so a wrong kind is a type
 * error. Diagnoses live in their own table and are handled separately.
 */
export const dentalFieldKinds = {
  // Dental history
  previousDentalVisit: "enum",
  previousDentalTreatment: "enum",
  toothache: "boolean",
  extraction: "boolean",
  dentalTrauma: "boolean",
  currentToothache: "boolean",
  toothSensitivity: "boolean",
  bleedingGums: "boolean",
  brushingFrequency: "enum",
  fluorideToothpaste: "enum",
  sugarConsumption: "enum",
  otherDentalHistory: "text",

  // Chief complaint
  chiefComplaint: "text",

  // Clinical examination: extraoral
  facialSymmetry: "enum",
  facialSwelling: "boolean",
  lymphadenopathy: "enum",
  mouthOpening: "enum",

  // Clinical examination: intraoral
  oralHygiene: "enum",
  plaque: "enum",
  calculus: "boolean",
  gingivalCondition: "enum",
  caries: "enum",
  missingTeeth: "boolean",
  fracturedTeeth: "boolean",
  mucosalLesions: "boolean",
  malocclusion: "enum",

  // Treatment provided
  fluorideStatus: "enum",
  fluorideOperator: "text",
  fluorideToothNumber: "text",
  sealantStatus: "enum",
  sealantOperator: "text",
  sealantToothNumber: "text",
  sdfStatus: "enum",
  sdfOperator: "text",
  sdfToothNumber: "text",
  scalingStatus: "enum",
  scalingOperator: "text",
  scalingToothNumber: "text",

  // Remarks
  remarks: "text",
} as const satisfies { [K in keyof Dental]?: KindOf<Dental[K]> };

export type DentalScalarField = keyof typeof dentalFieldKinds;

type FormValueOf<T> = [NonNullable<T>] extends [boolean]
  ? BooleanString | ""
  : string extends NonNullable<T>
    ? string
    : NonNullable<T> | "";

export type DentalScalarFormValues = {
  [K in DentalScalarField]: FormValueOf<Dental[K]>;
};

/** What the router receives; `null` clears a column on update. */
export type DentalScalarPayload = Pick<Dental, DentalScalarField>;

const scalarFields = Object.keys(dentalFieldKinds) as DentalScalarField[];

/** Maps a saved record (or none) to form values. */
export function toScalarFormValues(
  record: DentalScalarPayload | null,
): DentalScalarFormValues {
  const values: Record<string, string> = {};
  for (const field of scalarFields) {
    const saved = record?.[field] ?? null;
    values[field] =
      typeof saved === "boolean" ? (saved ? "true" : "false") : (saved ?? "");
  }
  return values as DentalScalarFormValues;
}

/**
 * Maps form values to the router payload. Unanswered fields are sent as
 * `null` (not `undefined`) so clearing a field actually clears it on update.
 */
export function toScalarPayload(
  values: DentalScalarFormValues,
): DentalScalarPayload {
  const payload: Record<string, string | boolean | null> = {};
  for (const field of scalarFields) {
    const value = values[field];
    switch (dentalFieldKinds[field]) {
      case "boolean":
        payload[field] = value === "" ? null : value === "true";
        break;
      case "text":
        payload[field] = value.trim() || null;
        break;
      case "enum":
        payload[field] = value || null;
        break;
    }
  }
  return payload as DentalScalarPayload;
}
