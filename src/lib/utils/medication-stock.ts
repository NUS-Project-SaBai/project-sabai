import { Payload } from "@/types/medication-stock";

function splitKey(split: Payload) {
  return JSON.stringify([
    split.location,
    split.stockStatus,
    split.quantity,
    split.remarks ?? "",
  ]);
}

function areSplitsDistinct(splits: Payload[]) {
  const seenKeys = new Set<string>();
  for (const split of splits) {
    const key = splitKey(split);
    if (seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
  }

  return true;
}

export function validateSplits(splits: Payload[], parentQty: number) {
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

  const quantity = splits.reduce(
    (accumulator, current) => accumulator + current.quantity,
    0,
  );

  if (quantity != parentQty) {
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
