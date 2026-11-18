import { z } from "zod";

export const partnerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please input a name.")
    .max(255, "Name must be 255 characters or fewer."),
  remarks: z.string().trim(),
  isActive: z.boolean(),
});

export const editPartnerFormSchema = partnerFormSchema.extend({
  id: z.uuid(),
});

export const createPartnerInput = partnerFormSchema.extend({
  // Blank remarks are stored as NULL. Always sending a value means an update can clear it.
  remarks: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
});

export const updatePartnerInput = createPartnerInput.extend({
  id: z.uuid(),
});

export type AddFormFields = z.infer<typeof partnerFormSchema>;
export type EditFormFields = z.infer<typeof editPartnerFormSchema>;
