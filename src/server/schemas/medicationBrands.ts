import { z } from "zod";

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  activeIngredientId: z.string().min(1, "Missing Active Ingredient!"),
  remarks: z.string().trim().optional(),
});

export const editBrandFormSchema = brandFormSchema.extend({
  id: z.number().int().positive(),
});

export const createBrandInput = brandFormSchema.extend({
  // The frontend converts the select's string value to a number.
  activeIngredientId: z.number().int().positive(),

  // Store empty remarks as null.
  remarks: brandFormSchema.shape.remarks.transform((value) => value || null),
});

export const updateBrandInput = createBrandInput.extend({
  id: z.number().int().positive(),
});

export type AddFormFields = z.infer<typeof brandFormSchema>;
export type EditFormFields = z.infer<typeof editBrandFormSchema>;
