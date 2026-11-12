import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { Button } from "@/components/interactive/Button/Button";
import { trpc } from "@/utils/trpc";
import { AddFormFields, nameRegisterOptions } from "./types";

const DEFAULT_VALUES: AddFormFields = {
  name: "",
  remarks: "",
  isActive: true,
};

export default function AddPartnerModal() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const form = useForm<AddFormFields>({ defaultValues: DEFAULT_VALUES });

  const utils = trpc.useUtils();

  const closeModal = () => {
    form.reset();
    setModalIsOpen(false);
  };

  const createMutation = trpc.referralPartnersRouter.create.useMutation({
    onSuccess: () => {
      toast.success("Successfully created!");
      utils.referralPartnersRouter.list.invalidate();
      closeModal();
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
        <Modal title="Add New Referral Partner" onClose={closeModal}>
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)(e);
              }}
            >
              <RHFInput
                name="name"
                label="Name"
                type="text"
                isRequired
                registerOptions={nameRegisterOptions}
              />
              <RHFInput name="remarks" label="Remarks" type="text" />
              <RHFInput name="isActive" label="Is Active?" type="checkbox" />
              <div className="flex flex-row gap-2">
                <Button
                  colour="emerald"
                  type="submit"
                  className="w-full"
                  title={createMutation.isPending ? "Saving..." : "Save"}
                  disabled={createMutation.isPending}
                />
                <Button
                  colour="red"
                  title="Cancel"
                  className="w-full"
                  onClick={closeModal}
                />
              </div>
            </form>
          </FormProvider>
        </Modal>
      )}

      <Button
        colour="indigo"
        onClick={() => setModalIsOpen(true)}
        title="Add Referral Partner"
      />
    </>
  );
}
