import { MedicationStock } from "@/db/schema";

import { medicationStatusValues } from "@/db/schema";

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
};

export type MedicationStockWithBrandAndActiveIngredient = MedicationStock & {
  medicationBrandName: string;
  medicationActiveIngredientName: string;
};
