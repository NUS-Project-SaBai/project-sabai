import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { NewVillageCode } from "@/db/schema";
import { DEFAULT_FORM, FormFields } from "@/lib/utils/villageCodeTypes";
import {
  FormProvider,
  useForm,
  SubmitHandler,
  useWatch,
} from "react-hook-form";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { useSaveOnWrite } from "@/hooks/useSaveOnWrite";
import { useEffect } from "react";
import { Button } from "@/components/interactive/Button/Button";

export default function ChangeModal({
  onClose,
  activeForm,
}: {
  onClose: () => void;
  activeForm: FormFields | null;
}) {
  const utils = trpc.useUtils();
  const [formData, setFormData, clearFormData] = useSaveOnWrite<NewVillageCode>(
    "village-codes-form",
    DEFAULT_FORM,
    [], // No dependencies
  );

  const isEditing = !!(activeForm && activeForm.id);

  // only use the saved data when creating a village code
  const currentValues = isEditing
    ? activeForm
    : {
        name: formData.name,
        code: formData.code,
        colorHex: formData.colorHex,
        isVisible: formData.isVisible,
      };

  const form = useForm<FormFields>({
    values: currentValues,
  });

  const watchedColor = useWatch({
    name: "colorHex",
    compute: (data: string) => {
      return data;
    },
    defaultValue: DEFAULT_FORM.colorHex,
    control: form.control,
  });

  // Useful link for subscription mechanism: https://react-hook-form.com/docs/useform/subscribe
  useEffect(() => {
    if (isEditing) return;

    return form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        setFormData({
          name: values?.name ?? DEFAULT_FORM.name,
          code: values?.code ?? DEFAULT_FORM.code,
          colorHex: values?.colorHex ?? DEFAULT_FORM.colorHex,
          isVisible: values?.isVisible ?? DEFAULT_FORM.isVisible,
        });
      },
    });
  }, [form, isEditing, setFormData]);

  const createMutation = trpc.villageCodesRouter.create.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      form.reset();
      clearFormData();
      onClose();
      toast.success("Village code created!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Unable to create village code.");
    },
  });

  const updateMutation = trpc.villageCodesRouter.update.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      form.reset();
      onClose();
      toast.success("Village code updated!");
    },
    onError: (err) => {
      console.log(err);
      toast.error("Unable to update village code.");
    },
  });

  const handleSubmit: SubmitHandler<FormFields> = async (data) => {
    if (activeForm && activeForm.id) {
      handleEdit(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = async (data: FormFields) => {
    const numDirtyFields = Object.keys(form.formState.dirtyFields).length;
    if (form.formState.isDirty || numDirtyFields > 0) {
      updateMutation.mutate({
        ...data,
        id: activeForm!.id!, // Non-null assertion operator because handleEdit only gets called by handleSubmit which already does the check
      });
    } else {
      toast.error("Fields not changed!");
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        {activeForm?.id ? "Edit Village Code" : "New Village Code"}
      </h2>
      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
        >
          <RHFInput
            name="code"
            label="Code"
            type="text"
            placeholder="e.g. V001"
            defaultValue={DEFAULT_FORM.code}
          />
          <RHFInput
            name="name"
            label="Name"
            type="text"
            placeholder="Central Village"
            defaultValue={DEFAULT_FORM.name}
          />
          <div className="flex gap-2 mt-1 items-end mb-4">
            <RHFInput
              name="colorHex"
              label="Color"
              type="color"
              className="w-full"
              defaultValue={DEFAULT_FORM.colorHex}
            />
            <input
              id="color-value"
              readOnly
              value={watchedColor}
              className="h-10 block w-full rounded-md border border-slate-300 px-3 bg-slate-50 text-slate-500"
            />
          </div>
          <RHFInput
            name="isVisible"
            label="Is Visible?"
            type="checkbox"
            className="flex flex-row-reverse"
          />
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              colour="red"
              onClick={onClose}
              title="Cancel"
              className="w-full"
            />
            <Button
              colour="emerald"
              title="Save"
              className="w-full"
              type="submit"
            />
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
