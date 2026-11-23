/** Boolean DB columns are held as strings by RHFRadio; "" means unanswered. */
export type BooleanString = "true" | "false";

export type RadioOption = { label: string; value: string };

export const fromBoolean = (
  value: boolean | null | undefined,
): BooleanString | "" => (value == null ? "" : value ? "true" : "false");

export const toBoolean = (value: BooleanString | ""): boolean | null =>
  value === "" ? null : value === "true";

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Turns enum values into radio options labelled in sentence case. */
export const toOptions = (values: readonly string[]): RadioOption[] =>
  values.map((value) => ({ label: capitalise(value), value }));

export const yesNoOptions: RadioOption[] = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

/** For boolean columns where `true` means the finding is present. */
export const absentPresentOptions: RadioOption[] = [
  { label: "Absent", value: "false" },
  { label: "Present", value: "true" },
];
