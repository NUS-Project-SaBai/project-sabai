import { MedicationStock, medicationStatusValues } from "@/db/schema";

export type StockStatus = (typeof medicationStatusValues)[number];

export const stockStatusDropdown = medicationStatusValues.map((status) => ({
  label: status,
  value: status,
}));

export type CreateFormFields = {
  medicationBrandId: number;
  quantity: number;
  expiry: Date;
  location: string;
  stockStatus: StockStatus;
  remarks?: string;
};

export type MedicationStockWithBrandAndActiveIngredient = MedicationStock & {
  medicationBrandName: string;
  medicationActiveIngredientName: string;
};

// Functions used for split stock

type Payload = {
  location: string;
  stockStatus: StockStatus;
  quantity: number;
  remarks: string | undefined;
};

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
  if (splits.length < 2) {
    return {
      success: false,
      message: "Must have at least 2 splits!",
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
