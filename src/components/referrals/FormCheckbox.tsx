import { clsx } from "clsx";
import { useFormContext } from "react-hook-form";

/**
 * **Important:** This component must be used within a `FormProvider` context.
 *
 * Checkbox with its label to the right, for the referral details sections.
 * Greyed out when disabled.
 * @param describedBy - id of an element describing the checkbox, e.g. a
 * tooltip explaining why it is disabled.
 */
export function FormCheckbox({
  name,
  label,
  disabled = false,
  describedBy,
}: {
  name: string;
  label: string;
  disabled?: boolean;
  describedBy?: string;
}) {
  const { register } = useFormContext();

  return (
    <label
      htmlFor={name}
      className={clsx(
        "inline-flex items-center gap-3 text-sm font-medium",
        disabled ? "cursor-not-allowed text-slate-400" : "cursor-pointer",
      )}
    >
      <input
        id={name}
        type="checkbox"
        disabled={disabled}
        aria-describedby={describedBy}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-500 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        {...register(name)}
      />
      {label}
    </label>
  );
}
