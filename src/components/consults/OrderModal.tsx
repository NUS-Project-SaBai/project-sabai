import Modal from "@/components/interactive/Modal";
import { trpc } from "@/utils/trpc";
import { SubmitHandler, UseFieldArrayAppend } from "react-hook-form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { useForm, FormProvider } from "react-hook-form";
import { OrderFormValue } from "@/types/consults";
import { Button } from "@/components/interactive/Button/Button";

export default function OrderModal({
  setOrderModalIsOpen,
}: {
  setOrderModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const utils = trpc.useUtils();

  const { data, isLoading, isError, error } =
    trpc.medicationStockRouter.listGroupByActiveIngredient.useQuery();

  const form = useForm<OrderFormValue>();

  const handleSubmit: SubmitHandler<OrderFormValue> = async (data) => {
    console.log(data);
  };

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
        <>
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)(e);
              }}
            >
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
              <RHFInput
                name="medicineQty"
                label="Quantity to Order"
                type="number"
                isRequired
                registerOptions={{
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Please input only positive values.",
                  },
                }}
              />
              <RHFInput
                name="dosageInstructions"
                label="Dosage Instructions"
                type="text"
                isRequired
              />
              <Button colour="emerald" title="Save Order" type="submit" />
            </form>
          </FormProvider>
        </>
      )}
    </Modal>
  );
}
