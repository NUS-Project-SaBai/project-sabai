import { RegisterOptions } from "react-hook-form";

export type EditFormFields = {
  id: string;
  name: string;
  remarks: string;
  isActive: boolean;
};

export type AddFormFields = Omit<EditFormFields, "id">;

export const nameRegisterOptions: RegisterOptions = {
  validate: (value: string) =>
    (value ?? "").trim() !== "" || "Please input a name.",
  maxLength: { value: 255, message: "Name must be 255 characters or fewer." },
};
