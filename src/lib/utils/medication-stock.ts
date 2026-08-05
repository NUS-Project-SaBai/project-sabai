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

type Payload = {
  location: string;
  stockStatus: StockStatus;
  quantity: number;
  remarks: string | undefined;
};

export function areStocksDistinct(stocks: Payload[]) {
  const stocksSet = new Set();
  for (let i = 0; i < stocks.length; i++) {
    const stringified = JSON.stringify(stocks[i]);
    if (stocksSet.has(stringified)) {
      return false;
    }
    stocksSet.add(stringified);
  }
  return true;
}
