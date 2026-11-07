export type EditFormFields = {
  id: number;
  name: string;
  activeIngredientId: string;
  remarks?: string;
};

export type AddFormFields = Omit<EditFormFields, "id">;
