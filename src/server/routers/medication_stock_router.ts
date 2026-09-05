import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { withUserAuth } from "@/db/withAuth";
import { eq, desc } from "drizzle-orm";
import {
  medicationBrands,
  medicationStatusEnum,
  medicationStock,
  medicationActiveIngredients,
} from "@/db/schema/pharmacy";

export const medicationStockRouter = router({
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationStock.id,
        medicationBrandId: medicationStock.medicationBrandId,
        quantity: medicationStock.quantity,
        expiry: medicationStock.expiry,
        location: medicationStock.location,
        stockStatus: medicationStock.stockStatus,
        remarks: medicationStock.remarks,
      })
      .from(medicationStock);
    return result;
  }),

  listWithBrandAndActiveIngredient: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationStock.id,
        medicationBrandId: medicationStock.medicationBrandId,
        quantity: medicationStock.quantity,
        expiry: medicationStock.expiry,
        location: medicationStock.location,
        stockStatus: medicationStock.stockStatus,
        remarks: medicationStock.remarks,
        medicationBrandName: medicationBrands.name,
        medicationActiveIngredientName: medicationActiveIngredients.name,
      })
      .from(medicationStock)
      .innerJoin(
        medicationBrands,
        eq(medicationStock.medicationBrandId, medicationBrands.id),
      )
      .innerJoin(
        medicationActiveIngredients,
        eq(medicationActiveIngredients.id, medicationBrands.activeIngredientId),
      )
      .orderBy(desc(medicationStock.id));
    return result;
  }),

  create: protectedProcedure
    .input(
      zfd.formData({
        medicationBrandId: zfd.numeric(z.number().int()),
        quantity: zfd.numeric(z.number().int()),
        expiry: zfd.text(z.coerce.date()),
        location: zfd.text(),
        stockStatus: zfd.text(z.enum(medicationStatusEnum.enumValues)),
        remarks: zfd.text(z.string().optional()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await withUserAuth(ctx.user.id, async (tx) => {
        const [newStock] = await tx
          .insert(medicationStock)
          .values(input)
          .returning();

        return newStock;
      });
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

  update: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()),
        location: zfd.text(z.string().optional()),
        stockStatus: zfd.text(
          z.enum(medicationStatusEnum.enumValues).optional(),
        ),
        remarks: z.preprocess(
          // To insert null instead of empty string into the db
          (val: string | undefined) =>
            val === undefined || val === null || val.trim() === ""
              ? null
              : val.trim(),
          z.string().nullable(),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await withUserAuth(ctx.user.id, async (tx) => {
        const { id, ...updateData } = input;
        const [result] = await tx
          .update(medicationStock)
          .set({ ...updateData })
          .where(eq(medicationStock.id, id))
          .returning();

        return result ? result : null;
      });
    }),
});
