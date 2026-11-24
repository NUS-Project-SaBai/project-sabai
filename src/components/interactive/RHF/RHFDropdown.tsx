import { IsRequiredStar } from "@/components/IsRequiredStar";
import { Controller, useFormContext } from "react-hook-form";
import { clsx } from "clsx";
import { FaChevronDown } from "react-icons/fa";

export type DropdownOption = {
  label: string;
  value: string;
};

type RHFDropdownProps = {
  name: string;
  label?: string;
  dropdownOptions: DropdownOption[];
  isRequired?: boolean;
  className?: string;
  placeholder?: string;
};

/**
 * **Important:** This component must be used within a `FormProvider` context.
 *
 * A React form component that wraps a native `<select>` element with React Hook Form integration.
 *
 * Using the native element means the option list is rendered by the browser, so it is
 * never clipped by modals or scroll containers, and keyboard navigation works out of the box.
 *
 * @param {string} name - The name of the form field for registration
 * @param {string} [label] - The label text displayed above the dropdown
 * @param {DropdownOption[]} dropdownOptions - Array of options with label and value properties
 * @param {boolean} [isRequired=false] - Whether the field is required for form submission
 * @param {string} [className=""] - Additional CSS classes to apply to the wrapper div
 * @param {string} [placeholder="Select an option"] - Placeholder text shown when no option is selected
 *
 * @example
 * ```tsx
 * const options = [
 *   { label: 'Option 1', value: 'opt1' },
 *   { label: 'Option 2', value: 'opt2' }
 * ];
 *
 * <RHFDropdown
 *   name="category"
 *   label="Category"
 *   dropdownOptions={options}
 *   isRequired={true}
 *   placeholder="Choose a category"
 * />
 * ```
 */
export function RHFDropdown({
  name,
  label,
  dropdownOptions,
  isRequired = false,
  className = "",
  placeholder = "Select an option",
}: RHFDropdownProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error("RHFDropdown must be used within a FormProvider context");
  }

  const { control, formState } = formContext;
  const fieldError = formState?.errors[name];

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <label htmlFor={name}>
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>
      <div className="relative">
        <Controller
          name={name}
          control={control}
          defaultValue=""
          rules={{
            required: isRequired ? `Missing ${label}!` : false,
          }}
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <select
              id={name}
              name={name}
              ref={ref}
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              aria-invalid={!!fieldError}
              className={clsx([
                "w-full cursor-pointer appearance-none truncate rounded border bg-white py-2 pl-4 pr-10 transition focus:outline-none focus:ring-2",
                fieldError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-blue-400",
                !value && "text-gray-500",
              ])}
            >
              {/* Only shown until a choice is made, so it can't be picked as a value. */}
              {!value && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {dropdownOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900"
                >
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
        <FaChevronDown
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
        />
      </div>
      {fieldError && (
        <p className="min-h-6 text-red-400">{fieldError.message?.toString()}</p>
      )}
    </div>
  );
}
