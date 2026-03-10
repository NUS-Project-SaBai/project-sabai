import { z } from "zod";
import { zfd } from "zod-form-data";
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
      zfd.formData({
        medicationBrandId: zfd.numeric(z.number().int()),
        quantity: zfd.numeric(z.number().int()),
        expiry: zfd.text(z.coerce.date()),
        location: zfd.text(),
        state: zfd.text(z.enum(medicationStatusEnum.enumValues)),
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
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()),
      }),
    )
    .mutation(async ({ input }) => {
      const [result] = await db
        .delete(medicationStock)
        .where(eq(medicationStock.id, input.id))
        .returning({ id: medicationStock.id });

      return { success: !!result };
    }),
});
