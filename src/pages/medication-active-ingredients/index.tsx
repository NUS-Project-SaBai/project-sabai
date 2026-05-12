import { trpc } from "@/utils/trpc";

function MedicationActiveIngredientsBasePage() {
  const { data: ingredients, isLoading } =
    trpc.medicationActiveIngredientsRouter.list.useQuery();

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Medication Active Ingredient
            </h1>
            <p className="mt-2 text-slate-600">
              Manage medication active ingredients.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          <svg
            className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading active ingredients...
        </div>
      ) : ingredients && ingredients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Ingredient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Ingredient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Unit of Measurement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fall below
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {ingredients.map((ingredient) => (
                <tr
                  key={ingredient.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {ingredient.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {ingredient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {ingredient.unitOfMeasurement}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {ingredient.fallBelow}
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

export default MedicationActiveIngredientsBasePage;
