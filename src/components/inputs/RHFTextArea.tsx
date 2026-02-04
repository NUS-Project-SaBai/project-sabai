import {
  DetailedHTMLProps,
  HTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { RegisterOptions } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";

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

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea id={name} {...registerProps} {...props} />
    </div>
  );
}
