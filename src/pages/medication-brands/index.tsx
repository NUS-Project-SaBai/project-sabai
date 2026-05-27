import { trpc } from "@/utils/trpc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";

function Header() {
  return (
    <div className="w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Medication Stock", href: "/medication-stock" },
              { label: "Medication Brands" },
            ]}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            Medication Brands
          </h1>
          <p className="mt-2 text-slate-600">Manage medication brands.</p>
        </div>
      </div>
    </div>
  );
}

function MedicationBrandsBasePage() {
  const {
    data: brands,
    isLoading,
    isError,
  } = trpc.medicationBrandRouter.list.useQuery();

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading brands..." />;
    }

    if (!brands || brands.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No medication brands found. Seed the database or add a new record.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader headers={["Brand ID", "Name", "Active Ingredient ID"]} />
          <tbody className="bg-white divide-y divide-slate-200">
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {brand.id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {brand.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {brand.activeIngredientId}
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

export default MedicationBrandsBasePage;
