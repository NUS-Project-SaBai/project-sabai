import { trpc } from "@/utils/trpc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { useState } from "react";
import Modal from "@/components/interactive/Modal";

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
              <TableRow key={ingredient.id}>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {ingredient.id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {ingredient.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {ingredient.unitOfMeasurement}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {ingredient.fallBelow}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-left gap-2">
                    <button className="text-sm font-medium text-slate-900">
                      Edit
                    </button>
                    <button className="text-sm font-medium text-slate-900">
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
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
