import Modal from "@/components/interactive/Modal";
import { trpc } from "@/utils/trpc";
import { UseFieldArrayAppend } from "react-hook-form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";

export default function OrderModal({
  setOrderModalIsOpen,
}: {
  setOrderModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const utils = trpc.useUtils();

  const { data, isLoading, isError, error } =
    trpc.medicationStockRouter.listGroupByActiveIngredient.useQuery();

  return (
    <Modal onClose={() => setOrderModalIsOpen(false)}>
      <h2 className="text-xl font-bold mb-4">Add Order</h2>
      Patient allergies placeholder
      {isError && (
        <h1 className="text-red-500">
          An error has occurred while loading medicine.
        </h1>
      )}
      {isLoading && (
        <LoadingSpinner message="Loading medicine..." className="p-6" />
      )}
      {!isLoading && !isError && (
        <RHFDropdown
          name="medicine"
          label="Medicine:"
          dropdownOptions={data!.map((elem) => ({
            value: `${elem.id}`,
            label: `${elem.activeIngredientName}, (${elem.unitOfMeasurement}) (Qty: ${elem.quantity})`,
          }))}
          className="mb-4"
          isRequired
        />
      )}
    </Modal>
  );
}
