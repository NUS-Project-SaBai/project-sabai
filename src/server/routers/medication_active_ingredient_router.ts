import { z } from "zod";
import { db } from "@/db/drizzle";
import { router, protectedProcedure } from "../trpc";
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
      })
      .from(medicationActiveIngredients);
    return result;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().nonoptional(),
        unitOfMeasurement: z.string().nonoptional(),
        fallBelow: z.number().int().optional(),
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
      z.object({
        id: z.number().int(),
        name: z.string().nonoptional(),
        unitOfMeasurement: z.string().nonoptional(),
        fallBelow: z.number().int().optional(),
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
      z.object({
        id: z.number().int(),
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
