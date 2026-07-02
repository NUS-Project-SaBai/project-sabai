import { MedicationStock } from "@/db/schema";

export enum StockStatus {
  ACTIVE = "active",
  DISPOSED = "disposed",
  DONATED = "donated",
  EXPIRED = "expired",
}

export const stockStatusDropdown = Object.values(StockStatus).map((status) => ({
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
