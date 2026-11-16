import { RHFInput } from "./RHFInput";
import { isFutureDate, parseDateInput } from "@/lib/utils/date";

/** Past-or-today date in DD/MM/YYYY; stores the visible text, callers convert it on submit. */
export function RHFDateInput({
  name,
  label,
  isRequired = false,
}: {
  name: string;
  label: string;
  isRequired?: boolean;
}) {
  // Returns true if valid, otherwise the error message to show.
  // Empty is allowed here; isRequired handles a missing value.
  const validateDate = (value: string) => {
    if (!value) return true;
    const iso = parseDateInput(value);
    if (iso === null) return "Enter a valid date in DD/MM/YYYY format";
    if (isFutureDate(iso)) return `${label} cannot be in the future`;
    return true;
  };

  return (
    <div className="flex flex-col">
      <RHFInput
        name={name}
        label={label}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        isRequired={isRequired}
        registerOptions={{ validate: validateDate }}
      />
      <p className="mt-3 text-xs text-slate-500">Format: DD/MM/YYYY</p>
    </div>
  );
}
