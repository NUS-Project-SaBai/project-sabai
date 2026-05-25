import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { trpc } from "@/utils/trpc";
import Link from "next/link";

function MedicationStockBasePage() {
  const { data: stock, isLoading } = trpc.medicationStockRouter.list.useQuery();

  return (
    <div className="min-h-screen flex-1 p-8">
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
                className="group flex items-center gap-2 p-2 rounded-md"
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
                className="group flex items-center gap-2 p-2 rounded-md"
              >
                <span>Manage Active Ingredients</span>
              </Link>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading stock..." />
      ) : stock && stock.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Medication Brand ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock State
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {stock.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-left gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-left gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.medicationBrandId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-left gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-left gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-left gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.stockStatus}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          No stock found. Seed the database or add a new record.
        </div>
      )}
    </div>
  );
}

export default MedicationStockBasePage;
