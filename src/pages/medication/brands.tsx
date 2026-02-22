import { trpc } from "@/utils/trpc";
import { withSession } from "@/lib/session";

function BrandsPage() {
  const { data: brands, isLoading } =
    trpc.medicationBrandRouter.list.useQuery();

  return (
    <div className="p-12 text-center text-slate-500">
      {isLoading ? (
        <h1>Loading </h1>
      ) : brands && brands.length > 0 ? (
        <table>
          <thead>
            <tr>
              <td>id</td>
              <td>name</td>
              <td>active_ingredient_id</td>
            </tr>
          </thead>
          <tbody>
            {brands.map((i) => (
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.name}</td>
                <td>{i.activeIngredientId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h1>No brands found</h1>
      )}
    </div>
  );
}

export default withSession(BrandsPage);
