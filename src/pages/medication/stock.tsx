import { trpc } from "@/utils/trpc";
import { withSession } from "@/lib/session";

function Stock() {
  const { data: stock, isLoading } = trpc.medicationStockRouter.list.useQuery();

  return (
    <div className="p-12 text-center text-slate-500">
      {isLoading ? (
        <h1>Loading </h1>
      ) : stock && stock.length > 0 ? (
        <table>
          <thead>
            <tr>
              <td>id</td>
              <td>medication_brand_id</td>
              <td>quantity</td>
              <td>expiry</td>
              <td>location</td>
              <td>state</td>
            </tr>
          </thead>
          <tbody>
            {stock.map((i) => (
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.medicationBrandId}</td>
                <td>{i.quantity}</td>
                <td>
                  {i.expiry == null ? (
                    <p>no expiry date listed</p>
                  ) : (
                    <p>{i.expiry.toString()}</p>
                  )}
                </td>
                <td>{i.location}</td>
                <td>{i.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h1>No stock found</h1>
      )}
    </div>
  );
}

export default withSession(Stock);
