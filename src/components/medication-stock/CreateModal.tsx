import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import clsx from "clsx";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import LoadingSpinner from "@/components/LoadingSpinner";

enum StockStatus {
  ACTIVE = "active",
  DISPOSED = "disposed",
  DONATED = "donated",
  EXPIRED = "expired",
}

const stockStatusDropdown = Object.values(StockStatus).map((status) => ({
  label: status,
  value: status,
}));

type CreateFormFields = {
  medicationBrandId: number;
  quantity: number;
  expiry: Date;
  location: string;
  stockStatus: StockStatus;
};

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
      utils.medicationStockRouter.list.invalidate();
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
              required: true,
            }}
            className="mb-4"
          />
          <RHFInput
            name="expiry"
            label="Expiry Date"
            type="date"
            className="mb-4"
          />

          {brandWithActiveIngredientIsLoading && (
            <LoadingSpinner message="Loading brands with active ingredients..." />
          )}

          {!brandWithActiveIngredientIsError ? (
            <RHFDropdown
              name="medicationBrandId"
              label="Brand + Active Ingredient"
              dropdownOptions={brandWithActiveIngredientData!.map((elem) => ({
                value: elem.id.toString(),
                label: `${elem.activeIngredientName} (${elem.name})`,
              }))}
              className="mb-4"
            />
          ) : (
            "An error has occurred while loading the dropdown options for brand + active ingredient. Please refresh the page."
          )}

          <RHFDropdown
            name="stockStatus"
            label="Status"
            dropdownOptions={stockStatusDropdown}
            className="mb-8"
          />
          <div className="flex flex-row gap-2">
            <button
              className={clsx(
                "flex-1 text-white px-4 py-1 rounded-lg font-medium",
                form.formState.isSubmitting
                  ? "bg-neutral-600"
                  : "bg-green-600 hover:bg-green-700",
              )}
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              className="bg-red-700 flex-1 text-white px-4 py-1 rounded-lg font-medium hover:bg-red-800"
              onClick={() => {
                form.reset();
                setModalIsOpen(false);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
