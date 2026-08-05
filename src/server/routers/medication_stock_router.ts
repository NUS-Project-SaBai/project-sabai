import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import {
  medicationBrands,
  medicationStatusEnum,
  medicationStock,
  medicationActiveIngredients,
} from "@/db/schema";
import { TRPCError } from "@trpc/server";

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
        medicationBrandId: zfd.numeric(z.number().int().optional()),
        quantity: zfd.numeric(z.number().int().optional()),
        expiry: zfd.text(z.coerce.date().optional()),
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
        splits: z
          .array(
            z.object({
              quantity: zfd.numeric(z.number().int()),
              location: zfd.text(z.string()),
              stockStatus: zfd.text(z.enum(medicationStatusEnum.enumValues)),
              remarks: zfd.text(z.string().optional()),
            }),
          )
          .min(2),
      }),
    )
    .mutation(async ({ input }) => {
      const { splits, parentId } = input;
      const parent = await db
        .select()
        .from(medicationStock)
        .where(eq(medicationStock.id, parentId))
        .limit(1); // Guaranteed to be one result anyway

      const totalSplitQty = splits.reduce(
        (sum, split) => sum + split.quantity,
        0,
      );

      if (parent[0].quantity != totalSplitQty) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Parent stock quantity not equal to splits quantity!",
        });
      }

      return db.transaction(async (tx) => {
        for (let i = 0; i < splits.length; i++) {
          // splits copy parent's medicationBrandId and expiry
          await tx.insert(medicationStock).values({
            medicationBrandId: parent[0].medicationBrandId,
            expiry: parent[0].expiry,
            quantity: splits[i].quantity,
            location: splits[i].location,
            stockStatus: splits[i].stockStatus,
            remarks: splits[i].remarks,
          });

          // TODO: stockChanges table obtains the IDs of the new splits and writes
        }

        // parent stock quantity reduces to 0
        await tx
          .update(medicationStock)
          .set({ quantity: 0 })
          .where(eq(medicationStock.id, parentId));
      });
    }),
});
