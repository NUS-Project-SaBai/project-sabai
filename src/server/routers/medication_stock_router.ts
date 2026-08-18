import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { eq, desc, ne } from "drizzle-orm";
import {
  medicationBrands,
  medicationStatusEnum,
  medicationStock,
  medicationActiveIngredients,
} from "@/db/schema/pharmacy";
import { TRPCError } from "@trpc/server";
import { splitSchema, validateSplits } from "@/types/medication-stock";

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
      .from(medicationStock)
      .where(ne(medicationStock.quantity, 0));
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
      .where(ne(medicationStock.quantity, 0))
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
        remarks: zfd.text(z.string().optional()),
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

  createSplits: protectedProcedure
    .input(
      z.object({
        parentId: zfd.numeric(z.number().int()),
        splits: z.array(splitSchema).min(2),
      }),
    )
    .mutation(async ({ input }) => {
      const { splits, parentId } = input;
      const parent = await db
        .select()
        .from(medicationStock)
        .where(eq(medicationStock.id, parentId))
        .limit(1); // Guaranteed to be one result anyway

      const { success, message } = validateSplits(splits, parent[0].quantity);

      if (!success) {
        throw new TRPCError({
          code: "CONFLICT",
          message: message,
        });
      }

      return db.transaction(async (tx) => {
        await tx.insert(medicationStock).values(
          splits.map((s) => ({
            medicationBrandId: parent[0].medicationBrandId,
            expiry: parent[0].expiry,
            quantity: s.quantity,
            location: s.location,
            stockStatus: s.stockStatus,
            remarks: s.remarks,
          })),
        );

        // parent stock quantity reduces to 0
        await tx
          .update(medicationStock)
          .set({ quantity: 0 })
          .where(eq(medicationStock.id, parentId));
      });
    }),
});
