import { MedicationStock, medicationStatusValues } from "@/db/schema/pharmacy";
import { stockPageStatusValues } from "@/lib/constants/medicationStock";
import z from "zod";
import { zfd } from "zod-form-data";

export type StockStatus = (typeof medicationStatusValues)[number];

export const stockStatusDropdown = stockPageStatusValues.map((status) => ({
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
  isLowStock: boolean;
};

export const splitSchema = z.object({
  quantity: zfd.numeric(z.number().int().positive()),
  location: zfd.text(z.string()),
  stockStatus: zfd.text(z.enum(stockPageStatusValues)),
  remarks: zfd.text(z.string().optional()),
});

export type SplitPayload = z.infer<typeof splitSchema>;

export type SplitChild = Omit<
  MedicationStockWithBrandAndActiveIngredient,
  "stockStatus"
> & {
  stockStatus: SplitPayload["stockStatus"];
};

export const StockStatusSchema = z
  .enum(medicationStatusValues)
  .refine((status) => status !== "reserved" && status !== "dispensed", {
    message: "Stock status cannot be reserved or dispensed.",
  });
