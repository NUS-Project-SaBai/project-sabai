import { DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";
import { IsRequiredStar } from "@/components/IsRequiredStar";
import { clsx } from "clsx";

type RHFInputProps = {
  name: string;
  label: string;
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  registerOptions?: RegisterOptions;
  type:
    "text" | "email" | "password" | "number" | "date" | "color" | "checkbox";
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

/**
 * **Important:** This component must be used within a `FormProvider` context.
 *
 * A React form component that wraps an input element with React Hook Form integration.
 *
 * Other RHF input components that are available:
 * - `RHFRadio` for radio inputs
 * - `RHFTextArea` for text area inputs
 *
 * @param {string} name - The name of the form field for registration
 * @param {string} label - The label text displayed above the input
 * @param {boolean} [isRequired=false] - Whether the field is required for form submission
 * @param {string} [className=""] - Additional CSS classes to apply to the wrapper div
 * @param {RegisterOptions} [registerOptions={}] - Additional React Hook Form register options
 * @param {"text" | "email" | "password" | "number" | "date" | "checkbox" | "color"} type - The HTML input type, use RHFRadio for radio input, and Button type="submit" for submit buttons
 * @param {HTMLInputElement} [props] - Additional HTML input element attributes
 *
 * @example
 * ```tsx
 * <RHFInput
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   isRequired={true}
 * />
 * ```
 */

export function RHFInput({
  name,
  label,
  isRequired = false,
  className = "",
  registerOptions = {},
  type,
  ...props
}: RHFInputProps) {
  const registerProps = useRHFRegister(
    name,
    label,
    isRequired,
    registerOptions,
  );

  const { formState } = useFormContext();
  const fieldError = formState?.errors?.[name];

  const isCheckbox = type === "checkbox";

  if (isCheckbox) {
    return (
      <div
        className={`grid grid-cols-[1fr_auto] items-center gap-4 py-3 px-3 rounded-md hover:bg-gray-50 transition ${className}`}
      >
        {/* LEFT: LABEL */}
        <label
          htmlFor={name}
          className="text-sm font-semibold text-gray-800 justify-self-start cursor-pointer"
        >
          {label}
          <IsRequiredStar isRequired={isRequired} />
        </label>

        {/* RIGHT: CHECKBOX (aligned in one column) */}
        <input
          id={name}
          type="checkbox"
          {...registerProps}
          {...props}
          className="h-4 w-4 accent-blue-500 cursor-pointer border-gray-300 rounded justify-self-end focus:ring-2 focus:ring-blue-400"
        />
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <label htmlFor={name}>
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>

      <input
        id={name}
        type={type}
        {...registerProps}
        {...props}
        className={clsx([
          "border border-gray-300 rounded bg-white px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
          fieldError &&
            "border-red-400 focus:ring-red-300 focus:border-red-400",
          type === "color" && "h-10",
        ])}
      />

      {fieldError && (
        <p className="mt-1 text-sm text-red-400">
          {fieldError.message?.toString()}
        </p>
      )}
    </div>
  );
}
