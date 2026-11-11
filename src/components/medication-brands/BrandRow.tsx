import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import EditableCell from "@/components/interactive/EditableCell";
import DeleteConfirmModal from "@/components/medication-brands/DeleteConfirmModal";
import { Button } from "@/components/interactive/Button/Button";
import type { MedicationBrand } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import type { EditFormFields } from "./types";
import IngredientDropdown from "./IngredientDropdown";

type BrandRowProps = MedicationBrand & {
  activeIngredientName: string;
  unitOfMeasurement: string;
};

export default function BrandRow(brand: BrandRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const form = useForm<EditFormFields>({
    values: {
      id: brand.id,
      name: brand.name,
      activeIngredientId: String(brand.activeIngredientId),
      remarks: brand.remarks ?? "",
    },
  });

  const {
    data: ingredients,
    isLoading,
    isError,
  } = trpc.medicationActiveIngredientsRouter.list.useQuery(undefined, {
    enabled: isEditing,
  });

  const selectedIngredientId = form.watch("activeIngredientId");
  const selectedIngredient = ingredients?.find(
    (ingredient) => String(ingredient.id) === selectedIngredientId,
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.medicationBrandRouter.update.useMutation({
    onSuccess: () => {
      toast.success("Successfully updated!");
      utils.medicationBrandRouter.listWithActiveIngredientName.invalidate();
    },
    onError: (err) => {
      toast.error("An error has occurred.");
      console.error(err);
      form.reset();
    },
  });

  const deleteMutation = trpc.medicationBrandRouter.delete.useMutation({
    onSuccess: () => {
      toast.success("Successfully deleted.");
      utils.medicationBrandRouter.listWithActiveIngredientName.invalidate();
    },
    onError: () => {
      toast.error(
        "Error! Check that there are no stock records that depend on this brand.",
      );
      setIsDeleting(false);
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit: SubmitHandler<EditFormFields> = async (data) => {
    const hasChanged =
      data.name !== brand.name ||
      Number(data.activeIngredientId) !== brand.activeIngredientId ||
      (data.remarks ?? "") !== (brand.remarks ?? "");

    if (!hasChanged) {
      toast.error("No form field changed!");
      return;
    }

    updateMutation.mutate({
      ...data,
      id: brand.id,
      activeIngredientId: Number(data.activeIngredientId),
    });

    setIsEditing(!isEditing);
  };

  return (
    <TableRow>
      <FormProvider {...form}>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">{brand.id}</span>
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
          {isEditing ? (
            <div className="text-sm font-medium text-slate-900">
              <IngredientDropdown
                ingredients={ingredients}
                isLoading={isLoading}
                isError={isError}
              />
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-900">
              {brand.activeIngredientName}
            </span>
          )}
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            {isEditing
              ? (selectedIngredient?.unitOfMeasurement ??
                brand.unitOfMeasurement)
              : brand.unitOfMeasurement}
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
                onConfirm={() => deleteMutation.mutate({ id: brand.id })}
                brand={brand}
              />
            )}
          </div>
        </TableCell>
      </FormProvider>
    </TableRow>
  );
}
