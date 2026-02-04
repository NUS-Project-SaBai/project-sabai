import { DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes } from "react";
import { RegisterOptions } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";
<input type="" />;
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
 * Custom RHF component for input.
 *
 * Other RHF input components that are available:
 * - `RHFRadio` for radio inputs
 * - `RHFTextArea` for text area inputs
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
 *
 * @param {string} name - The name of the form field for registration
 * @param {string} label - The label text displayed above the input
 * @param {boolean} [isRequired=false] - Whether the field is required for form submission
 * @param {string} [className=""] - Additional CSS classes to apply to the wrapper div
 * @param {RegisterOptions} [registerOptions={}] - Additional React Hook Form register options
 * @param {"text" | "email" | "password" | "number" | "date"} type - The HTML input type, use RHFRadio for radio input, and Button type="submit" for submit buttons
 * @param {HTMLInputElement} [props] - Additional HTML input element attributes
 *
 * @throws {Error} If used outside of a FormProvider context
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

  return (
    <div className={className}>
      <label htmlFor={name}>{label}</label>
      <input id={name} type={type} {...registerProps} {...props} />
    </div>
  );
}
