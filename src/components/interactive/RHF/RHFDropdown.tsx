import { IsRequiredStar } from "@/components/IsRequiredStar";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useClickOutside } from "@/hooks/useClickOutside";
import { clsx } from "clsx";
import { FaChevronDown } from "react-icons/fa";

export type DropdownOption = {
  label: string;
  value: string;
};

interface RHFDropdownButtonProps {
  selectedOption?: DropdownOption;
  placeholder: string;
  isOpen: boolean;
  onClick: () => void;
  hasError: boolean;
  name: string;
}

interface RHFDropdownMenuProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  name: string;
}

/**
 * Internal dropdown button component used by `RHFDropdown`.
 *
 * Renders a clickable button that displays the selected option or placeholder text,
 * with visual feedback for open state and validation errors. The button shows
 * different border colors based on its state: red for errors, blue when open,
 * and gray for normal state.
 */
function RHFDropdownButton({
  selectedOption,
  placeholder,
  isOpen,
  onClick,
  hasError,
  name,
}: RHFDropdownButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx([
        "w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
        hasError
          ? "border-red-400 focus:ring-red-300 focus:border-red-400"
          : "hover:border-gray-400",
        isOpen && "border-blue-500",
      ])}
      name={`${name}-dropdown-button`}
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
  );
}

/**
 * Internal dropdown menu component used by `RHFDropdown`.
 *
 * Renders an absolutely positioned dropdown menu with scrollable options.
 * Each option is clickable and shows visual feedback for selection and hover states.
 * The menu automatically closes when an option is selected.
 */
function RHFDropdownMenu({
  options,
  selectedValue,
  onSelect,
  onClose,
  name,
}: RHFDropdownMenuProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-900 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          className={clsx([
            "w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg text-gray-800 hover:text-gray-900",
            option.value === selectedValue && "bg-blue-50 text-blue-700",
          ])}
          name={`${name}-${option.value}-dropdown-option`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
 * A React form component that wraps a dropdown select element with React Hook Form integration.
 *
 * Features click-outside functionality to close the dropdown when clicking elsewhere,
 * validation error display, and customizable styling. The dropdown shows a button
 * with the selected option or placeholder text, and an absolutely positioned menu
 * with scrollable options when opened.
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
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
                <RHFDropdownButton
                  selectedOption={selectedOption}
                  placeholder={placeholder}
                  isOpen={isOpen}
                  onClick={() => setIsOpen(!isOpen)}
                  hasError={!!fieldError}
                  name={name}
                />

                {isOpen && (
                  <RHFDropdownMenu
                    options={dropdownOptions}
                    selectedValue={value}
                    onSelect={onChange}
                    onClose={() => setIsOpen(false)}
                    name={name}
                  />
                )}
              </>
            );
          }}
        />
      </div>
      {fieldError && (
        <p className="min-h-6 text-red-400">
          {fieldError.message?.toString()}
        </p>
      )}
    </div>
  );
}
