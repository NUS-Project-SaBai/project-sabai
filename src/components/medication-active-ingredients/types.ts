export type EditFormFields = {
  id: number;
  name: string;
  unitOfMeasurement: string;
  fallBelow: number;
  remarks?: string;
};

export type AddFormFields = Omit<EditFormFields, "id">;
