import { trpc } from "@/utils/trpc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  )
}


function MedicationBrandsBasePage() {
  const { data: brands, isLoading } =
    trpc.medicationBrandRouter.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex-1 p-8">
        <Header />
        <LoadingSpinner message="Loading brands..." />
      </div>
    )
  }

  if (!brands || brands.length == 0) {
    return (
      <div className="min-h-screen flex-1 p-8">
        <Header />
        <div className="p-12 text-center text-slate-500">
          No medication brands found. Seed the database or add a new record.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1 p-8">
      <Header />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Brand ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Ingredient ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-left gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {brand.id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-left gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {brand.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-left gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {brand.activeIngredientId}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MedicationBrandsBasePage;
