import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { medicationActiveIngredients, medicationBrands } from "@/db/schema";

export const medicationBrandRouter = router({
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationBrands.id,
        name: medicationBrands.name,
        activeIngredientId: medicationBrands.activeIngredientId,
      })
      .from(medicationBrands);
    return result;
  }),

  listWithActiveIngredientName: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationBrands.id,
        name: medicationBrands.name,
        activeIngredientName: medicationActiveIngredients.name,
      })
      .from(medicationBrands)
      .innerJoin(
        medicationActiveIngredients,
        eq(medicationActiveIngredients.id, medicationBrands.activeIngredientId),
      );

    return result;
  }),

  create: protectedProcedure
    .input(
      zfd.formData({
        name: zfd.text(z.string().nonoptional()),
        activeIngredientId: zfd.numeric(z.number().int()),
      }),
    )
    .mutation(async ({ input }) => {
      const [newMedicationBrand] = await db
        .insert(medicationBrands)
        .values(input)
        .returning();
      return newMedicationBrand;
    }),

  update: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()).nonoptional(),
        name: zfd.text().optional(),
        activeIngredientId: zfd.numeric(z.number().int()),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(medicationBrands)
        .set(updateData)
        .where(eq(medicationBrands.id, id))
        .returning();

      return result ?? null;
    }),

  delete: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await db
        .delete(medicationBrands)
        .where(eq(medicationBrands.id, input.id))
        .returning({ id: medicationBrands.id });
      return { success: !!result };
    }),
});
