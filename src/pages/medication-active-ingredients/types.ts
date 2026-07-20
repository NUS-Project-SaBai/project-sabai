export type EditFormFields = {
  id: number;
  name: string;
  unitOfMeasurement: string;
  fallBelow: number;
};

export type AddFormFields = Omit<EditFormFields, "id">;
