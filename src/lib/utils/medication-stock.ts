import {
  MedicationStock,
  medicationStatusValues,
  medicationStatusEnum,
} from "@/db/schema/pharmacy";
import z from "zod";
import { zfd } from "zod-form-data";

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

export const splitSchema = z.object({
  quantity: zfd.numeric(z.number().int()),
  location: zfd.text(z.string()),
  stockStatus: zfd.text(z.enum(medicationStatusEnum.enumValues)),
  remarks: zfd.text(z.string().optional()),
});

export type Payload = z.infer<typeof splitSchema>;

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
