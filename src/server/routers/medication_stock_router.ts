import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { medicationStatusEnum, medicationStock } from "@/db/schema";

export const medicationStockRouter = router({
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationStock.id,
        medicationBrandId: medicationStock.medicationBrandId,
        quantity: medicationStock.quantity,
        expiry: medicationStock.expiry,
        location: medicationStock.location,
        state: medicationStock.state,
      })
      .from(medicationStock);
    return result;
  }),

  create: protectedProcedure
    .input(
      z.object({
        medicationBrandId: z.number().int(),
        quantity: z.number().int(),
        expiry: z.coerce.date(),
        location: z.string(),
        state: z.enum(medicationStatusEnum.enumValues),
      }),
    )
    .mutation(async ({ input }) => {
      const [newStock] = await db
        .insert(medicationStock)
        .values(input)
        .returning();
      return newStock;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [result] = await db
        .delete(medicationStock)
        .where(eq(medicationStock.id, input.id))
        .returning({ id: medicationStock.id });

      return { success: !!result };
    }),
});
