import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  stockStatusDropdown,
  CreateFormFields,
} from "@/lib/utils/medication-stock";
import { Button } from "@/components/interactive/Button/Button";

export default function CreateModal({
  setModalIsOpen,
}: {
  setModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const utils = trpc.useUtils();

  const form = useForm<CreateFormFields>();

  const {
    data: brandWithActiveIngredientData,
    isLoading: brandWithActiveIngredientIsLoading,
    isError: brandWithActiveIngredientIsError,
  } = trpc.medicationBrandRouter.listWithActiveIngredientName.useQuery();

  const createMutation = trpc.medicationStockRouter.create.useMutation({
    onSuccess: () => {
      toast.success("Successfully created!");
      utils.medicationStockRouter.listWithBrandAndActiveIngredient.invalidate();
      form.reset();
      setModalIsOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("An error has occurred.");
    },
  });

  const handleSubmit: SubmitHandler<CreateFormFields> = async (data) => {
    createMutation.mutate(data);
  };

  return (
    <Modal onClose={() => setModalIsOpen(false)}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">
        Add New Stock
      </h2>
      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
        >
          <RHFInput
            name="location"
            label="Location"
            type="text"
            className="mb-4"
            isRequired
          />
          <RHFInput
            name="quantity"
            label="Quantity"
            type="number"
            registerOptions={{
              valueAsNumber: true,
              min: {
                value: 1,
                message: "Please input only positive values.",
              },
            }}
            className="mb-4"
            isRequired
          />
          <RHFInput
            name="expiry"
            label="Expiry Date"
            type="date"
            className="mb-4"
            isRequired
          />

          {brandWithActiveIngredientIsLoading && (
            <LoadingSpinner message="Loading brands with active ingredients..." />
          )}

          {brandWithActiveIngredientIsError &&
            "An error has occurred while loading the dropdown options for brand + active ingredient. Please refresh the page."}

          {!brandWithActiveIngredientIsError &&
            !brandWithActiveIngredientIsLoading && (
              <RHFDropdown
                name="medicationBrandId"
                label="Brand + Active Ingredient"
                dropdownOptions={brandWithActiveIngredientData!.map((elem) => ({
                  value: elem.id.toString(),
                  label: `${elem.activeIngredientName} (${elem.name})`,
                }))}
                className="mb-4"
                isRequired
              />
            )}

          <RHFDropdown
            name="stockStatus"
            label="Status"
            dropdownOptions={stockStatusDropdown}
            className="mb-8"
            isRequired
          />
          <div className="flex flex-row gap-2">
            <Button
              colour="emerald"
              disabled={createMutation.isPending}
              type="submit"
              title={createMutation.isPending ? "Saving..." : "Save"}
            />
            <Button
              title="Cancel"
              colour="red"
              onClick={() => {
                form.reset();
                setModalIsOpen(false);
              }}
            />
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
