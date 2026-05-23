import { IsRequiredStar } from "@/components/IsRequiredStar";
import { clsx } from "clsx";
import {
  DetailedHTMLProps,
  HTMLAttributes,
  useState,
  useRef,
  useEffect,
} from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FaChevronDown } from "react-icons/fa";

export type DropdownOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type RHFDropdownProps = {
  name: string;
  label?: string;
  dropdownOptions: DropdownOption[];
  isRequired?: boolean;
  className?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >["className"];
  placeholder?: string;
};

/**
 * **Important:** This component must be used within a `FormProvider` context.
 *
 * A React form component that wraps a dropdown element with React Hook Form integration.
 *
 * Other RHF input components that are available:
 * - `RHFInput` for text inputs
 * - `RHFRadio` for radio inputs
 * - `RHFTextArea` for text area inputs
 *
 * @param {string} name - The name of the form field for registration
 * @param {string} label - The label text displayed above the dropdown
 * @param {DropdownOption[]} dropdownOptions - Array of dropdown options with value and label
 * @param {boolean} [isRequired=false] - Whether the field is required for form submission
 * @param {string} [className=""] - Additional CSS classes to apply to the wrapper div
 * @param {string} [placeholder="Select an option"] - Placeholder text when no option is selected
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' }
 * ];
 * <RHFDropdown
 *   name="selection"
 *   label="Choose Option"
 *   dropdownOptions={options}
 *   isRequired={true}
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={className}>
      <label htmlFor={name}>
        {label}
        <IsRequiredStar isRequired={isRequired} />
      </label>
      <div ref={dropdownRef} className="relative">
        <Controller
          name={name}
          control={control}
          defaultValue=""
          rules={{
            required: isRequired ? `Missing ${label}!` : false,
          }}
          render={({ field: { value, onChange } }) => {
            const selectedOption = dropdownOptions.find(
              (option) => option.value === value,
            );

            return (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={clsx([
                    "w-full flex items-center justify-between px-4 py-2 border-2 rounded bg-white hover:cursor-pointer transition",
                    fieldError
                      ? "border-red-400 border-l-8"
                      : "border-gray-300 hover:border-gray-400 focus:border-blue-500",
                    isOpen && "ring-2 ring-blue-200",
                  ])}
                >
                  <span
                    className={clsx([
                      "flex-1 text-left",
                      !selectedOption && "text-gray-500",
                    ])}
                  >
                    {selectedOption ? selectedOption.label : placeholder}
                  </span>
                  <FaChevronDown
                    className={clsx([
                      "w-4 h-4 transition-transform duration-200",
                      isOpen && "transform rotate-180",
                    ])}
                  />
                </button>

                {isOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {dropdownOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (!option.disabled) {
                            onChange(option.value);
                            setIsOpen(false);
                          }
                        }}
                        disabled={option.disabled}
                        className={clsx([
                          "w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg",
                          option.disabled
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-800 hover:text-gray-900",
                          option.value === value && "bg-blue-50 text-blue-700",
                        ])}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          }}
        />
      </div>
      <p className="min-h-6 text-red-400">
        {fieldError ? fieldError.message?.toString() : ""}
      </p>
    </div>
  );
}
