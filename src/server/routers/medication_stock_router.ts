import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { eq, desc, gte, and, sum } from "drizzle-orm";
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

  listGroupByActiveIngredient: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: medicationActiveIngredients.id,
        activeIngredientName: medicationActiveIngredients.name,
        unitOfMeasurement: medicationActiveIngredients.unitOfMeasurement,
        quantity: sum(medicationStock.quantity),
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
      .where(
        and(
          eq(medicationStock.stockStatus, "active"),
          gte(medicationStock.expiry, new Date()),
        ),
      )
      .groupBy(
        medicationActiveIngredients.id,
        medicationActiveIngredients.name,
        medicationActiveIngredients.unitOfMeasurement,
      );

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
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(medicationStock)
        .set({ ...updateData })
        .where(eq(medicationStock.id, id))
        .returning();

      return result ? result : null;
    }),
});
