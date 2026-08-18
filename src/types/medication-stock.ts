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
  quantity: zfd.numeric(z.number().int().positive()),
  location: zfd.text(z.string()),
  stockStatus: zfd.text(z.enum(medicationStatusEnum.enumValues)),
  remarks: zfd.text(z.string().optional()),
});

export type Payload = z.infer<typeof splitSchema>;

