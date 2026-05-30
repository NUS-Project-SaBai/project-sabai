import { trpc } from "@/utils/trpc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { useState } from "react";
import Modal from "@/components/interactive/Modal";
import { MedicationActiveIngredient } from "@/db/schema";
import {
  FormProvider,
  useForm,
  useWatch,
  SubmitHandler,
} from "react-hook-form";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";

type FormFields = {
  id: number;
  name: string;
  unitOfMeasurement: string;
  fallBelow: number | undefined;
};

function Header() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  return (
    <div className="w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Medication Stock", href: "/medication-stock" },
              { label: "Medication Active Ingredients" },
            ]}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            Medication Active Ingredient
          </h1>
          <p className="mt-2 text-slate-600">
            Manage medication active ingredients.
          </p>
        </div>
        <Modal setIsOpen={setModalIsOpen} isOpen={modalIsOpen}>
          <p>Contents go here</p>
        </Modal>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
          onClick={() => {
            setModalIsOpen(true);
          }}
        >
          Add Active Ingredient
        </button>
      </div>
    </div>
  );
}

function Row({
  id,
  name,
  unitOfMeasurement,
  fallBelow,
}: MedicationActiveIngredient) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const form = useForm<FormFields>({
    defaultValues: {
      name: name,
      unitOfMeasurement: unitOfMeasurement,
      fallBelow: fallBelow ?? undefined,
    },
  });

  const utils = trpc.useUtils();
  const updateMutation =
    trpc.medicationActiveIngredientsRouter.update.useMutation({
      onSuccess: () => {
        console.log("Success");
        utils.medicationActiveIngredientsRouter.list.invalidate();
      },
      onError: () => {
        console.log("error!");
        form.reset();
      },
    });

  const deleteMutation =
    trpc.medicationActiveIngredientsRouter.delete.useMutation({
      onSuccess: () => {
        console.log("deleted");
        utils.medicationActiveIngredientsRouter.list.invalidate();
      },
      onError: () => {
        console.log("error!");
      },
    });

  const watched = form.watch();

  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  const handleSubmit: SubmitHandler<FormFields> = async (data) => {
    //console.log(data);
    // smulate writing to db
    // await new Promise((resolve) => setTimeout(resolve, 5000));
    updateMutation.mutate({
      id: id,
      name: form.getValues().name,
      unitOfMeasurement: form.getValues().unitOfMeasurement,
      fallBelow: form.getValues().fallBelow,
    });

    setIsEditing(!isEditing);
  };

  const handleDelete = async () => {
    console.log("being deleted");
    deleteMutation.mutate({
      id: id,
    });
  };

  return (
    <TableRow>
      <FormProvider {...form}>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">{id}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            {isEditing ? (
              <RHFInput type="text" name="name" label="" />
            ) : (
              watched.name
            )}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            {isEditing ? (
              <RHFInput type="text" name="unitOfMeasurement" label="" />
            ) : (
              watched.unitOfMeasurement
            )}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            {isEditing ? (
              <RHFInput type="text" name="fallBelow" label="" />
            ) : (
              watched.fallBelow
            )}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-left gap-2">
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit(handleSubmit)(e);
                }}
              >
                <button
                  className={`bg-green-600 text-white px-4 py-1 rounded-lg font-medium ${isSubmitting ? "bg-neutral-600" : "bg-green-600 hover:bg-green-700"}`}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </form>
            ) : (
              <button
                className="bg-green-600 text-white px-4 py-1 rounded-lg font-medium hover:bg-green-700"
                onClick={() => setIsEditing(!isEditing)}
              >
                Edit
              </button>
            )}

            {isEditing ? (
              <button
                className="bg-red-700 text-white px-4 py-1 rounded-lg font-medium hover:bg-red-800"
                onClick={() => {
                  form.reset();
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            ) : (
              <button
                className="bg-red-700 text-white px-4 py-1 rounded-lg font-medium hover:bg-red-800"
                onClick={() => {
                  setIsDeleting(true);
                }}
              >
                Delete
              </button>
            )}

            {isDeleting && (
              <Modal isOpen={isDeleting} setIsOpen={setIsDeleting}>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Confirm Deletion?
                </h2>
                <table>
                  <tbody>
                    <tr>
                      <td>Active Ingredient:</td>
                      <td>{name}</td>
                    </tr>
                    <tr>
                      <td>Unit:</td>
                      <td>{unitOfMeasurement}</td>
                    </tr>
                    <tr>
                      <td>Fall Below:</td>
                      <td>{fallBelow}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex flex-row gap-2">
                  <button
                    onClick={(e) => {
                      console.log("confirm button clicked");
                      handleDelete(); //note that this will be blocked if cascade needed, since no specified behaviour goes to default => on delete restrict
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </Modal>
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
      return <LoadingSpinner message="Loading active ingredients..." />;
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
              "Actions",
            ]}
          />
          <tbody className="bg-white divide-y divide-slate-200">
            {ingredients.map((ingredient) => (
              <Row key={ingredient.id} {...ingredient} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 p-8">
      <Header />
      {renderContent()}
    </div>
  );
}

export default MedicationActiveIngredientsBasePage;
