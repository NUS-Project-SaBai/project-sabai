import { SplitPayload } from "@/types/medication-stock";
import { MAX_SPLITS } from "@/lib/constants/medicationStock";

function splitKey(split: SplitPayload) {
  return JSON.stringify([
    split.location,
    split.stockStatus,
    split.quantity,
    split.remarks ?? "",
  ]);
}

function areSplitsDistinct(splits: SplitPayload[]) {
  return new Set(splits.map(splitKey)).size == splits.length;
}

export function validateSplits(splits: SplitPayload[], parentQty: number) {
  if (splits.length === 0) {
    return {
      success: false,
      message: "Submitting without a split does nothing!",
    };
  }

  if (splits.length === 1) {
    return {
      success: false,
      message:
        "Please use the editing function instead to edit a single split!",
    };
  }

  if (splits.length > MAX_SPLITS) {
    return {
      success: false,
      message: `Please do not exceed ${MAX_SPLITS} splits!`,
    };
  }

  const quantity = splits.reduce(
    (accumulator, current) => accumulator + current.quantity,
    0,
  );

  if (quantity !== parentQty) {
    return {
      success: false,
      message: "Child stock quantity does not equal parent stock quantity!",
    };
  }

  if (!areSplitsDistinct(splits)) {
    return {
      success: false,
      message: "Splits are not distinct!",
    };
  }

  return {
    success: true,
    message: "Splits are valid!",
  };
}

/**
 * Allocates `quantity` across `candidates` in the order given.
 * Stocks that are fully consumed are returned in `wholeStockIds`; the final stock,
 * if only partly consumed, is returned as `partial` with the amount to take from it.
 */
export function allocateStock<T extends { id: number; quantity: number }>(
  candidates: T[],
  quantity: number,
) {
  let outstanding = quantity;
  const wholeStockIds: number[] = [];
  let partial: { stock: T; take: number } | null = null;

  for (const stock of candidates) {
    if (outstanding === 0) {
      break;
    }

    if (stock.quantity <= outstanding) {
      wholeStockIds.push(stock.id);
      outstanding -= stock.quantity;
    } else {
      partial = { stock, take: outstanding };
      outstanding = 0;
    }
  }

  if (outstanding > 0) {
    return {
      success: false as const,
      message: `Insufficient stock: ${quantity - outstanding} of ${quantity} available.`,
    };
  }

  return {
    success: true as const,
    wholeStockIds,
    partial,
  };
}
