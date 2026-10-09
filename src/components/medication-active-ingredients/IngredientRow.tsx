import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import EditableCell from "@/components/interactive/EditableCell";
import { Button } from "@/components/interactive/Button/Button";
import { MedicationActiveIngredient } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import { positiveNumberOptions } from "@/lib/utils/medication";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { EditFormFields } from "./types";

export default function IngredientRow(ingredient: MedicationActiveIngredient) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const form = useForm<EditFormFields>({
    values: {
      id: ingredient.id,
      name: ingredient.name,
      unitOfMeasurement: ingredient.unitOfMeasurement,
      fallBelow: ingredient.fallBelow,
      remarks: ingredient.remarks ?? "",
    },
  });

  const utils = trpc.useUtils();
  const updateMutation =
    trpc.medicationActiveIngredientsRouter.update.useMutation({
      onSuccess: () => {
        toast.success("Successfully updated!");
        utils.medicationActiveIngredientsRouter.list.invalidate();
      },
      onError: (err) => {
        toast.error("An error has occurred.");
        console.error(err);
        form.reset();
      },
    });

  const deleteMutation =
    trpc.medicationActiveIngredientsRouter.delete.useMutation({
      onSuccess: () => {
        toast.success("Successfully deleted.");
        utils.medicationActiveIngredientsRouter.list.invalidate();
      },
      onError: () => {
        toast.error(
          "Error! Check that there are no brands that depend on this active ingredient.",
        );
        setIsDeleting(false);
      },
    });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit: SubmitHandler<EditFormFields> = async (data) => {
    const hasChanged =
      data.name !== ingredient.name ||
      data.unitOfMeasurement !== ingredient.unitOfMeasurement ||
      data.fallBelow !== ingredient.fallBelow ||
      data.remarks !== ingredient.remarks;

    if (!hasChanged) {
      toast.error("No form field changed!");
      return;
    }

    updateMutation.mutate({
      ...data,
      id: ingredient.id,
    });

    setIsEditing(!isEditing);
  };

  return (
    <TableRow>
      <FormProvider {...form}>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            {ingredient.id}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="name"
              type="text"
              value={form.getValues().name}
              label=""
            />
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="unitOfMeasurement"
              type="text"
              value={form.getValues().unitOfMeasurement}
              label=""
            />
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="fallBelow"
              type="number"
              value={form.getValues().fallBelow}
              label=""
              registerOptions={positiveNumberOptions}
            />
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="remarks"
              type="text"
              value={form.getValues().remarks}
              label=""
            />
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-left gap-2">
            {isEditing ? (
              <Button
                colour="emerald"
                disabled={isSubmitting}
                onClick={() => form.handleSubmit(handleSubmit)()}
                title={isSubmitting ? "Saving..." : "Save"}
              />
            ) : (
              <Button
                colour="emerald"
                onClick={() => setIsEditing(!isEditing)}
                title="Edit"
              />
            )}

            {isEditing ? (
              <Button
                onClick={() => {
                  form.reset();
                  setIsEditing(false);
                }}
                colour="red"
                title="Cancel"
              />
            ) : (
              <Button
                onClick={() => {
                  setIsDeleting(true);
                }}
                colour="red"
                title="Delete"
              />
            )}

            {isDeleting && (
              <DeleteConfirmModal
                onCancel={() => setIsDeleting(false)}
                onConfirm={() => deleteMutation.mutate({ id: ingredient.id })}
                ingredient={ingredient}
              />
            )}
          </div>
        </TableCell>
      </FormProvider>
    </TableRow>
  );
}
