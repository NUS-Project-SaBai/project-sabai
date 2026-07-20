import { trpc } from "@/utils/trpc";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { useState } from "react";
import Modal from "@/components/interactive/Modal";
import { MedicationActiveIngredient } from "@/db/schema/pharmacy";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import toast from "react-hot-toast";
import EditableCell from "@/components/interactive/EditableCell";
import { Button } from "@/components/interactive/Button/Button";
import { positiveNumberOptions } from "@/lib/utils/medication";

type EditFormFields = {
  id: number;
  name: string;
  unitOfMeasurement: string;
  fallBelow: number;
  remarks?: string;
};

type AddFormFields = Omit<EditFormFields, "id">;

function Header() {
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
    <PageHeader
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Medication Stock", href: "/medication-stock" },
        { label: "Medication Active Ingredients" },
      ]}
      title="Medication Active Ingredient"
      description="Manage medication active ingredients."
      actions={
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
      }
    />
  );
}

function DeleteConfirmModal({
  ingredient,
  onConfirm,
  onCancel,
}: {
  ingredient: MedicationActiveIngredient;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Confirm Deletion?
      </h2>
      <table>
        <tbody>
          <tr>
            <td>Active Ingredient:</td>
            <td>{ingredient.name}</td>
          </tr>
          <tr>
            <td>Unit:</td>
            <td>{ingredient.unitOfMeasurement}</td>
          </tr>
          <tr>
            <td>Fall Below:</td>
            <td>{ingredient.fallBelow}</td>
          </tr>
          <tr>
            <td>Remarks:</td>
            <td>{ingredient.remarks}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-row gap-2">
        <Button
          onClick={onCancel}
          colour="red"
          title="Cancel"
          className="w-full"
        />
        <Button
          onClick={onConfirm}
          colour="emerald"
          title="Confirm"
          className="w-full"
        />
      </div>
    </Modal>
  );
}

function Row(ingredient: MedicationActiveIngredient) {
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

function MedicationActiveIngredientsBasePage() {
  const {
    data: ingredients,
    isLoading,
    isError,
  } = trpc.medicationActiveIngredientsRouter.list.useQuery();

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return (
        <LoadingSpinner
          message="Loading active ingredients..."
          className="p-12"
        />
      );
    }

    if (!ingredients || ingredients.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No active ingredient found. Seed the database or add a new record.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader
            headers={[
              "Active Ingredient ID",
              "Active Ingredient Name",
              "Unit of Measurement",
              "Fall Below",
              "Remarks",
              "Actions",
            ]}
          />
          <tbody className="bg-white divide-y divide-slate-200">
            {ingredients.map((ingredient) => (
              <IngredientRow key={ingredient.id} {...ingredient} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 p-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Medication Stock", href: "/medication-stock" },
          { label: "Medication Active Ingredients" },
        ]}
        title="Medication Active Ingredient"
        description="Manage medication active ingredients."
        actions={<AddIngredientModal />}
      />
      {renderContent()}
    </div>
  );
}

export default MedicationActiveIngredientsBasePage;
