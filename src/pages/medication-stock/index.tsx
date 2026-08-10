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
import { SetStateAction, useState } from "react";
import {
  MedicationStockWithBrandAndActiveIngredient,
  StockStatus,
  stockStatusDropdown,
} from "@/lib/utils/medication-stock";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import EditableCell from "@/components/interactive/EditableCell";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import toast from "react-hot-toast";

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
              <Row
                key={item.id}
                setSplittingStock={setSplittingStock}
                item={item}
              />
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

// Only able to edit location, stockStatus and remarks.
// All other fields are locked from editing.
type EditFormFields = {
  id: number;
  location: string;
  stockStatus: StockStatus;
  remarks: string;
};

function Row({
  item,
  setSplittingStock,
}: {
  item: MedicationStockWithBrandAndActiveIngredient;
  setSplittingStock: React.Dispatch<
    SetStateAction<MedicationStockWithBrandAndActiveIngredient | null>
  >;
}) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const form = useForm<EditFormFields>({
    values: {
      id: item.id,
      location: item.location,
      stockStatus: item.stockStatus,
      remarks: item.remarks ?? "",
    },
  });

  const { isDirty } = form.formState;

  const utils = trpc.useUtils();

  const updateMutation = trpc.medicationStockRouter.update.useMutation({
    onSuccess: () => {
      toast.success("Successfully updated!");
      utils.medicationStockRouter.listWithBrandAndActiveIngredient.invalidate();
      form.reset();
      setIsEditing(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error(
        "An error has occurred while updating the stock. Refresh and try again.",
      );
    },
  });

  const handleSubmit: SubmitHandler<EditFormFields> = async (data) => {
    if (isDirty) {
      updateMutation.mutate(data);
    } else {
      toast.error("No fields changed!");
    }
  };

  return (
    <TableRow key={item.id}>
      <FormProvider {...form}>
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
            <EditableCell
              isEditing={isEditing}
              name="location"
              type="text"
              value={form.getValues().location}
              label=""
            />
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
            {isEditing ? (
              <RHFDropdown
                name="stockStatus"
                label=""
                dropdownOptions={stockStatusDropdown}
              />
            ) : (
              form.getValues().stockStatus
            )}
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
          <span className="text-sm font-medium text-slate-900 flex flex-row gap-2">
            {isEditing ? (
              <Button
                onClick={() => {
                  form.handleSubmit(handleSubmit)();
                }}
                colour="emerald"
                title="Save"
              />
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                colour="emerald"
                title="Edit"
              />
            )}
            <Button
              onClick={() => setSplittingStock(item)}
              colour="indigo"
              title="Split"
            />
          </span>
        </TableCell>
      </FormProvider>
    </TableRow>
  );
}

export default MedicationStockBasePage;
