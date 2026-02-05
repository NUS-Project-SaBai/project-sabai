import { DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";
import { IsRequiredStar } from "./IsRequiredStar";

type RHFInputProps = {
  name: string;
  label: string;
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  registerOptions?: RegisterOptions;
  type: "text" | "email" | "password" | "number" | "date";
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
 * @param {"text" | "email" | "password" | "number" | "date"} type - The HTML input type, use RHFRadio for radio input, and Button type="submit" for submit buttons
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
  const fieldError = formState?.errors[name];

  return (
    <div className={className}>
      <label htmlFor={name}>
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>
      <input
        id={name}
        type={type}
        {...registerProps}
        {...props}
        className={
          fieldError ? "border-red-400 border-l-8 border-2" : "border-2"
        }
      />
      <p className="min-h-6 text-red-400">
        {fieldError ? fieldError.message?.toString() : ""}
      </p>
    </div>
  );
}
