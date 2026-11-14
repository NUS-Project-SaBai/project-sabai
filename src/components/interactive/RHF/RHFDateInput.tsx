import { RHFInput } from "./RHFInput";
import { parseDateInput } from "@/lib/utils/date";

/** Stores the visible calendar date in form state; callers convert it on submit. */
export function RHFDateInput({
  name,
  label,
  isRequired = false,
}: {
  name: string;
  label: string;
  isRequired?: boolean;
}) {
  return (
    <RHFInput
      name={name}
      label={label}
      type="text"
      placeholder="DD/MM/YYYY"
      isRequired={isRequired}
      registerOptions={{
        validate: (value) =>
          !value ||
          parseDateInput(value) !== null ||
          "Enter a valid date in DD/MM/YYYY format",
      }}
    />
  );
}
