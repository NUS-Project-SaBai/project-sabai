import { Payload } from "@/types/medication-stock";


function areSplitsDistinct(splits: Payload[]) {
  const splitsSet = new Set();
  for (let i = 0; i < splits.length; i++) {
    const stringified = JSON.stringify(splits[i]);
    if (splitsSet.has(stringified)) {
      return false;
    }
    splitsSet.add(stringified);
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
      message: "Please use the editing function instead to edit a single split!",
    };
  }

  const quantity = splits.reduce(
    (accumulator, current) => accumulator + current.quantity,
    0
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
