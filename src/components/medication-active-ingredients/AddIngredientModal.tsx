import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { Button } from "@/components/interactive/Button/Button";
import { trpc } from "@/utils/trpc";
import { positiveNumberOptions } from "@/lib/utils/medication";
import { AddFormFields } from "./types";

export default function AddIngredientModal() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const form = useForm<AddFormFields>();

  const utils = trpc.useUtils();

  const createMutation =
    trpc.medicationActiveIngredientsRouter.create.useMutation({
      onSuccess: () => {
        toast.success("Successfully created!");
        utils.medicationActiveIngredientsRouter.list.invalidate();
        form.reset();
        setModalIsOpen(false);
      },
      onError: (err) => {
        console.error(err);
        toast.error("An error has occurred.");
      },
    });

  const handleSubmit: SubmitHandler<AddFormFields> = async (data) => {
    createMutation.mutate(data);
  };

  return (
    <>
      {modalIsOpen && (
        <Modal onClose={() => setModalIsOpen(false)}>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">
            Add New Active Ingredient
          </h2>
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)(e);
              }}
            >
              <RHFInput name="name" label="Name" type="text" />
              <RHFInput
                name="unitOfMeasurement"
                label="Unit of Measurement"
                type="text"
              />
              <RHFInput
                name="fallBelow"
                label="Fall below"
                type="number"
                registerOptions={positiveNumberOptions}
              />
              <RHFInput name="remarks" label="Remarks" type="text" />
              <div className="flex flex-row gap-2">
                <Button
                  colour="emerald"
                  type="submit"
                  className="w-full"
                  title={form.formState.isSubmitting ? "Saving..." : "Save"}
                  disabled={form.formState.isSubmitting}
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
        title="Add Active Ingredient"
      />
    </>
  );
}
