import { z } from "zod";
import { zfd } from "zod-form-data";
import { db } from "@/db/drizzle";
import { router, protectedProcedure } from "@/server/trpc";
import { medicationActiveIngredients } from "@/db/schema";
import { eq } from "drizzle-orm";

export const medicationActiveIngredientsRouter = router({
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationActiveIngredients.id,
        name: medicationActiveIngredients.name,
        unitOfMeasurement: medicationActiveIngredients.unitOfMeasurement,
        fallBelow: medicationActiveIngredients.fallBelow,
        remarks: medicationActiveIngredients.remarks,
      })
      .from(medicationActiveIngredients)
      .orderBy(medicationActiveIngredients.id);
    return result;
  }),

  create: protectedProcedure
    .input(
      zfd.formData({
        name: zfd.text().nonoptional(),
        unitOfMeasurement: zfd.text().nonoptional(),
        fallBelow: zfd.numeric(z.number().int().positive()).nonoptional(),
        remarks: zfd.text().nonoptional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newActiveIngredient] = await db
        .insert(medicationActiveIngredients)
        .values(input)
        .returning();
      return newActiveIngredient;
    }),

  update: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()),
        name: zfd.text().nonoptional(),
        unitOfMeasurement: zfd.text().nonoptional(),
        fallBelow: zfd.numeric(z.number().int().positive()).nonoptional(),
        remarks: zfd.text(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(medicationActiveIngredients)
        .set(updateData)
        .where(eq(medicationActiveIngredients.id, id))
        .returning();
      return result;
    }),

  delete: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()),
      }),
    )
    .mutation(async ({ input }) => {
      const [result] = await db
        .delete(medicationActiveIngredients)
        .where(eq(medicationActiveIngredients.id, input.id))
        .returning({ id: medicationActiveIngredients.id });
      return { success: !!result };
    }),
});
