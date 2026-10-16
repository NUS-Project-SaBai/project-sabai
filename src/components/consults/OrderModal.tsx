import Modal from "@/components/interactive/Modal";
import { trpc } from "@/utils/trpc";
import { SubmitHandler } from "react-hook-form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { useForm, FormProvider } from "react-hook-form";
import { OrderFormValue } from "@/types/consults";
import { Button } from "@/components/interactive/Button/Button";

export default function OrderModal({
  setOrderModalIsOpen,
  onSave,
}: {
  setOrderModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (order: OrderFormValue) => void;
}) {
  const { data, isLoading, isError } =
    trpc.medicationStockRouter.listGroupByActiveIngredient.useQuery();

  const form = useForm<OrderFormValue>({
    defaultValues: {
      activeIngredientId: "",
      quantity: undefined,
      dosageInstructions: "",
    },
  });

  const handleSubmit: SubmitHandler<OrderFormValue> = (values) => {
    const selected = data?.find(
      (elem) => `${elem.id}` === values.activeIngredientId,
    );
    if (!selected) return;

    const available = Number(selected.quantity ?? 0);

    // A soft check only
    if (values.quantity > available) {
      form.setError("quantity", {
        message: `Only ${available} ${selected.unitOfMeasurement} available.`,
      });
      return;
    }

    onSave({
      activeIngredientId: values.activeIngredientId,
      activeIngredientName: selected.activeIngredientName,
      quantity: values.quantity,
      dosageInstructions: values.dosageInstructions.trim(),
    });
    setOrderModalIsOpen(false);
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
        <FormProvider {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(handleSubmit)(e);
            }}
          >
            <RHFDropdown
              name="activeIngredientId"
              label="Medicine:"
              dropdownOptions={(data ?? []).map((elem) => ({
                value: `${elem.id}`,
                label: `${elem.activeIngredientName}, (${elem.unitOfMeasurement}) (Qty: ${elem.quantity})`,
              }))}
              className="mb-4"
              isRequired
            />
            <RHFInput
              name="quantity"
              label="Quantity to Order"
              className="mb-4"
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
              className="mb-4"
            />
            <Button colour="emerald" title="Save Order" type="submit" />
          </form>
        </FormProvider>
      )}
    </Modal>
  );
}
