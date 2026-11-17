import toast from "react-hot-toast";
import { HiCheck, HiXMark } from "react-icons/hi2";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/utils/trpc";

export type PendingVisit =
  inferRouterOutputs<AppRouter>["ordersRouter"]["listPending"][number];
export type PendingOrder = PendingVisit["orders"][number];

/** e.g. "31/12/2027". */
function formatExpiry(expiry: Date) {
  return new Date(expiry).toLocaleDateString("en-GB");
}

/**
 * One pending prescription with buttons to approve (dispense its reserved
 * stock) or cancel it (return its reserved stock to the shelf).
 */
export function PendingOrderItem({ order }: { order: PendingOrder }) {
  const utils = trpc.useUtils();
  const resolve = trpc.ordersRouter.resolve.useMutation({
    onSuccess: (_, { status }) => {
      toast.success(
        status === "APPROVED" ? "Order approved" : "Order cancelled",
      );
    },
    onError: (error) => toast.error(error.message),
    // Refresh on error too: a CONFLICT means the list is stale.
    onSettled: async () => {
      await Promise.all([
        utils.ordersRouter.listPending.invalidate(),
        utils.medicationStockRouter.invalidate(),
      ]);
    },
  });

  const medication = order.activeIngredientName ?? "Unknown medication";
  // An order can draw on several brands of the same active ingredient.
  const brands = [...new Set(order.items.map((item) => item.brandName))];
  const unit = order.unitOfMeasurement ? ` ${order.unitOfMeasurement}` : "";

  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-1 whitespace-normal text-sm text-slate-700">
        <p className="font-semibold text-slate-900">
          {medication}
          {brands.length > 0 && ` (${brands.join(", ")})`}
        </p>
        {order.items.length > 0 ? (
          <ul className="space-y-0.5">
            {order.items.map((item) => (
              <li key={item.stockId}>
                {formatExpiry(item.expiry)} - {item.location} - {item.quantity}
                {unit}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">
            No stock reserved - {order.quantity}
            {unit}
          </p>
        )}
        <p>
          <span className="font-semibold text-slate-900">
            Dosage instruction:
          </span>{" "}
          {order.dosageInstructions}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          aria-label={`Approve ${medication}`}
          title="Approve"
          disabled={resolve.isPending}
          onClick={() =>
            resolve.mutate({ orderId: order.id, status: "APPROVED" })
          }
          className="rounded-lg bg-emerald-600 p-3 text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-50"
        >
          <HiCheck className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={`Cancel ${medication}`}
          title="Cancel"
          disabled={resolve.isPending}
          onClick={() =>
            resolve.mutate({ orderId: order.id, status: "CANCELLED" })
          }
          className="rounded-lg bg-red-600 p-3 text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}
