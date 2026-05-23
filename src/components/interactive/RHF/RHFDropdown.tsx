import { IsRequiredStar } from "@/components/IsRequiredStar";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
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
 * Dropdown component with React Hook Form integration.
 * Must be used within a FormProvider context.
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
                    "w-full flex items-center justify-between px-4 py-2 border rounded bg-white transition",
                    fieldError
                      ? "border-red-400"
                      : "border-gray-300 hover:border-gray-400 focus:border-blue-500",
                    isOpen && "border-blue-500",
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
                      "w-4 h-4 transition-transform",
                      isOpen && "rotate-180",
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
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                        className={clsx([
                          "w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg text-gray-800 hover:text-gray-900",
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
      {fieldError && (
        <p className="text-sm text-red-500 mt-1">
          {fieldError.message?.toString()}
        </p>
      )}
    </div>
  );
}
