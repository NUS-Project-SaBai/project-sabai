import { trpc } from "@/utils/trpc";
import { withSession } from "@/lib/session";

function ActiveIngredientsPage() {
  const { data: activeIngredients, isLoading } =
    trpc.medicationActiveIngredientsRouter.list.useQuery();

  return (
    <div className="p-12 text-center text-slate-500">
      {isLoading ? (
        <h1>Loading </h1>
      ) : activeIngredients && activeIngredients.length > 0 ? (
        <table>
          <thead>
            <tr>
              <td>id</td>
              <td>name</td>
              <td>unit of measurement</td>
              <td>fall below</td>
            </tr>
          </thead>
          <tbody>
            {activeIngredients.map((i) => (
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.name}</td>
                <td>{i.unitOfMeasurement}</td>
                <td>{i.fallBelow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h1>No active ingredients found</h1>
      )}
    </div>
  );
}

export default withSession(ActiveIngredientsPage);
