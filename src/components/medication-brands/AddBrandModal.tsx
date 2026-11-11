import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { Button } from "@/components/interactive/Button/Button";
import { trpc } from "@/utils/trpc";
import type { AddFormFields } from "./types";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandFormSchema } from "@/server/schemas/medicationBrands";
import IngredientDropdown from "./IngredientDropdown";

export default function AddBrandModal() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const form = useForm<AddFormFields>({
    resolver: zodResolver(brandFormSchema),
  });

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
                form.handleSubmit(handleSubmit)(e);
              }}
            >
              <RHFInput name="name" label="Name" type="text" />

              <IngredientDropdown
                ingredients={ingredients}
                isLoading={isLoading}
                isError={isError}
                label="Active Ingredient"
                isRequired={true}
              />

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
