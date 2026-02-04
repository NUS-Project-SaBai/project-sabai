import { clsx } from "clsx";
import { DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes } from "react";
import { Controller, RegisterOptions, useFormContext } from "react-hook-form";
import { FaCheck } from "react-icons/fa";
import { IsRequiredStar } from "./IsRequiredStar";

type RHFRadioProps = {
  name: string;
  label: string;
  radioOptions: { label: string; value: string }[];
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  numberOfColumns?: number;
};

/**
 * A controlled radio button group component integrated with React Hook Form.
 *
 * Renders a set of radio button options in a responsive grid layout. The component
 * manages form state through React Hook Form's `Controller` and displays visual
 * feedback for selected options.
 *
 * @param {string} name - The field name for form control registration
 * @param {string} label - The label text displayed above the radio group
 * @param {Array<{value: string, label: string}>} radioOptions - Array of radio button options with value and label
 * @param {boolean} [isRequired=false] - Whether the field is required; shows validation error if true
 * @param {string} [className=""] - Additional CSS classes to apply to the container
 * @param {number} [numberOfColumns] - Number of grid columns for the radio options. If undefined, defaults to responsive grid (2 cols, 3 md, 4 lg)
 *
 * @example
 * const options = [
 *   { value: 'male', label: 'Male' },
 *   { value: 'female', label: 'Female' }
 * ];
 * <RHFRadio
 *   name="gender"
 *   label="Gender"
 *   radioOptions={options}
 *   isRequired={true}
 * />
 */
export function RHFRadio({
  name,
  label,
  radioOptions,
  isRequired = false,
  className = "",
  numberOfColumns = undefined,
}: RHFRadioProps) {
  const { control, formState } = useFormContext();
  const fieldError = formState?.errors[name];
  return (
    <div className={className}>
      <label>
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>
      <div
        className={clsx([
          "grid gap-2 p-1",
          !numberOfColumns && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          fieldError ? "border-red-400 border-2 rounded" : "",
        ])}
      >
        <Controller
          name={name}
          control={control}
          defaultValue={""}
          rules={{
            required: isRequired ? `Missing ${label}!` : false,
          }}
          render={({ field: { value, onChange } }) => (
            <>
              {radioOptions.map((option) => (
                <div
                  key={option.value}
                  className={clsx([
                    "flex items-center gap-2 px-4 py-2 border w-fit rounded hover:cursor-pointer hover:shadow ",
                    value === option.value
                      ? "border-blue-600 bg-blue-200 font-semibold"
                      : "border-gray-300 bg-gray-50 text-gray-500",
                  ])}
                  onClick={() => onChange(option.value)}
                >
                  {value === option.value ? (
                    <FaCheck className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                  <p>{option.label}</p>
                </div>
              ))}
            </>
          )}
        />
      </div>
      <p className="min-h-6 text-red-400">
        {fieldError ? fieldError.message?.toString() : ""}
      </p>
    </div>
  );
}
