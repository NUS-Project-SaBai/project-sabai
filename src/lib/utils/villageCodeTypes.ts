import { NewVillageCode } from "@/db/schema/schema";

export const DEFAULT_FORM: NewVillageCode = {
  code: "",
  name: "",
  colorHex: "#3b82f6", // Default blue
  isVisible: true,
};

export type FormFields = {
  id?: number;
  name: string;
  code: string;
  colorHex: string;
  isVisible: boolean | undefined;
};
