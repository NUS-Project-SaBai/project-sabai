import { trpc } from "@/utils/trpc";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";

function Header() {
  return (
    <PageHeader
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Medication Stock", href: "/medication-stock" },
        { label: "Medication Brands" },
      ]}
      title="Medication Brands"
      description="Manage medication brands."
    />
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
      return <LoadingSpinner message="Loading brands..." className="p-12" />;
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
          <TableHeader
            headers={["Brand ID", "Name", "Remarks", "Active Ingredient ID"]}
          />
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
                    {brand.remarks}
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
