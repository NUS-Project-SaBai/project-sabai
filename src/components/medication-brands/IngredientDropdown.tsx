import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";

type IngredientDropdownProps = {
  ingredients?: { id: number; name: string }[];
  isLoading: boolean;
  isError: boolean;
  label?: string;
  isRequired?: boolean;
};

export default function IngredientDropdown({
  ingredients,
  isLoading,
  isError,
  label = "",
  isRequired = false,
}: IngredientDropdownProps) {
  if (isLoading) {
    return <span className="text-sm">Loading active ingredients...</span>;
  }

  if (isError) {
    return (
      <span className="text-sm text-red-500">
        Unable to load active ingredients.
      </span>
    );
  }

  if (!ingredients?.length) {
    return <span className="text-sm">No active ingredients available.</span>;
  }

  return (
    <RHFDropdown
      name="activeIngredientId"
      label={label}
      isRequired={isRequired}
      dropdownOptions={ingredients.map((ingredient) => ({
        value: String(ingredient.id),
        label: ingredient.name,
      }))}
    />
  );
}
