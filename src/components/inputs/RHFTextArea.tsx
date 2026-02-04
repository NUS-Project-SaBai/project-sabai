import {
  DetailedHTMLProps,
  HTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";
import { IsRequiredStar } from "./IsRequiredStar";

type RHFTextAreaProps = {
  name: string;
  label: string;
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  registerOptions?: RegisterOptions;
  textAreaRows?: number;
} & DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

/**
 * A React form component that wraps a textarea element with React Hook Form integration.
 *
 * @example
 * ```tsx
 * <RHFTextArea
 *   name="description"
 *   label="Description"
 *   isRequired={true}
 * />
 * ```
 *
 * @param {string} name - The field name for form registration
 * @param {string} label - The label text displayed above the textarea
 * @param {boolean} [isRequired=false] - Whether the field is required for form validation
 * @param {string} [className=""] - Additional CSS classes to apply to the wrapper div
 * @param {RegisterOptions} [registerOptions={}] - React Hook Form register options for validation rules
 * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props - Standard HTML textarea attributes
 */
export function RHFTextArea({
  name,
  label,
  isRequired = false,
  className = "",
  registerOptions = {},
  ...props
}: RHFTextAreaProps) {
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>
      <textarea
        id={name}
        className={
          fieldError ? "border-red-400 border-l-8 border-2" : "border-2"
        }
        {...registerProps}
        {...props}
      />
      <p className="min-h-6 text-red-400">
        {fieldError ? fieldError.message?.toString() : ""}
      </p>
    </div>
  );
}
