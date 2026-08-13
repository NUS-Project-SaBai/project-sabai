import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/interactive/Button/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import CreateModal from "@/components/medication-stock/CreateModal";
import SplittingModal from "@/components/medication-stock/SplittingModal";
import TableCell from "@/components/TableCell";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useState } from "react";
import { MedicationStockWithBrandAndActiveIngredient } from "@/types/medication-stock";

function Header() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  return (
    <div className="w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Medication Stock" },
            ]}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            Medication Stock
          </h1>
          <p className="mt-2 text-slate-600">Manage medication stock.</p>
          <button
            type="submit"
            className={`flex-1 px-4 py-2 rounded-lg font-medium bg-red-300`}
          >
            <Link
              href="/medication-brands"
              className="group flex items-center p-2 rounded-md"
            >
              <span>Manage Brands</span>
            </Link>
          </button>
          <button
            type="submit"
            className={`flex-1 px-4 py-2 rounded-lg font-medium bg-red-300`}
          >
            <Link
              href="/medication-active-ingredients"
              className="group flex items-center p-2 rounded-md"
            >
              <span>Manage Active Ingredients</span>
            </Link>
          </button>
        </div>

        {modalIsOpen && <CreateModal setModalIsOpen={setModalIsOpen} />}
        <Button
          onClick={() => {
            setModalIsOpen(true);
          }}
          title="Add Stock"
          colour="indigo"
        />
      </div>
    </div>
  );
}

function MedicationStockBasePage() {
  const {
    data: stock,
    isLoading,
    isError,
  } = trpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [splittingStock, setSplittingStock] =
    useState<MedicationStockWithBrandAndActiveIngredient | null>(null);

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading stock..." className="p-12" />;
    }

    if (!stock || stock.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No stock found. Seed the database or add a new record.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        {splittingStock && (
          <SplittingModal
            onClose={() => setSplittingStock(null)}
            stock={splittingStock}
          />
        )}
        {isEditing && <span>editing</span>}
        {/* TODO: Implement stock editing, placeholder for now*/}
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader
            headers={[
              "Active Ingredient",
              "Brand",
              "Location",
              "Quantity",
              "Expiry",
              "State",
              "Remarks",
              "Actions",
            ]}
          />
          <tbody className="bg-white divide-y divide-slate-200">
            {stock.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.medicationActiveIngredientName}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.medicationBrandName}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.location}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.expiry?.toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.stockStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {item.remarks}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900 flex flex-row gap-2">
                    <Button
                      onClick={() => setIsEditing(true)}
                      colour="emerald"
                      title="Edit"
                    />
                    <Button
                      onClick={() => setSplittingStock(item)}
                      colour="indigo"
                      title="Split"
                    />
                  </span>
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

export default MedicationStockBasePage;
