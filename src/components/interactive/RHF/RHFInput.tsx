import { DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";
import { useRHFRegister } from "./useRHFRegister";
import { IsRequiredStar } from "@/components/IsRequiredStar";

type RHFInputProps = {
  name: string;
  label: string;
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  registerOptions?: RegisterOptions;
  type: "text" | "email" | "password" | "number" | "date" | "checkbox";
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

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
          className="
            h-4 w-4
            accent-blue-500
            cursor-pointer
            border-gray-300
            rounded
            justify-self-end
            focus:ring-2 focus:ring-blue-400
          "
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-700 flex items-center gap-1"
      >
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>

      <input
        id={name}
        type={type}
        {...registerProps}
        {...props}
        className={`
          w-full rounded-md px-3 py-2 text-sm
          border transition
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
          ${
            fieldError
              ? "border-red-400 focus:ring-red-300 focus:border-red-400"
              : "border-gray-300"
          }
        `}
      />

      <p className="min-h-5 text-xs text-red-500 mt-1">
        {fieldError?.message?.toString()}
      </p>
    </div>
  );
}
