import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Button } from "@/components/interactive/Button/Button";
import { trpc } from "@/utils/trpc";
import type { AddFormFields } from "./types";

export default function AddBrandModal() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const form = useForm<AddFormFields>();

  const utils = trpc.useUtils();

  const {
    data: ingredients,
    isLoading,
    isError,
  } = trpc.medicationActiveIngredientsRouter.list.useQuery(undefined, {
    enabled: modalIsOpen,
  });

  const createMutation = trpc.medicationBrandRouter.create.useMutation({
    onSuccess: () => {
      toast.success("Successfully created!");
      utils.medicationBrandRouter.listWithActiveIngredientName.invalidate();
      form.reset();
      setModalIsOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("An error has occurred.");
    },
  });

  const handleSubmit: SubmitHandler<AddFormFields> = async (data) => {
    createMutation.mutate({
      ...data,
      activeIngredientId: Number(data.activeIngredientId),
    });
  };

  return (
    <>
      {modalIsOpen && (
        <Modal title="Add New Brand" onClose={() => setModalIsOpen(false)}>
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)(e);
              }}
            >
              <RHFInput name="name" label="Name" type="text" />

              {isLoading ? (
                <span>Loading active ingredients...</span>
              ) : isError ? (
                <span className="text-red-500">
                  Unable to load active ingredients.
                </span>
              ) : !ingredients?.length ? (
                <span>No active ingredients available.</span>
              ) : (
                <RHFDropdown
                  name="activeIngredientId"
                  label="Active Ingredient"
                  isRequired
                  dropdownOptions={ingredients.map((ingredient) => ({
                    value: String(ingredient.id),
                    label: ingredient.name,
                  }))}
                />
              )}

              <RHFInput name="remarks" label="Remarks" type="text" />

              <div className="mt-4 flex flex-row gap-2">
                <Button
                  colour="emerald"
                  type="submit"
                  className="w-full"
                  title={form.formState.isSubmitting ? "Saving..." : "Save"}
                  disabled={
                    form.formState.isSubmitting ||
                    isLoading ||
                    isError ||
                    !ingredients?.length
                  }
                />
                <Button
                  colour="red"
                  title="Cancel"
                  className="w-full"
                  onClick={() => {
                    form.reset();
                    setModalIsOpen(false);
                  }}
                />
              </div>
            </form>
          </FormProvider>
        </Modal>
      )}

      <Button
        colour="indigo"
        onClick={() => setModalIsOpen(true)}
        title="Add Brand"
      />
    </>
  );
}
