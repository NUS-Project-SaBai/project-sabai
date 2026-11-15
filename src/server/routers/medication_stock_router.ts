import { z } from "zod";
import { zfd } from "zod-form-data";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { withUserTransaction } from "@/db/withUserTransaction";
import { eq, desc, ne, gte, and, sum } from "drizzle-orm";
import {
  medicationBrands,
  medicationStatusEnum,
  medicationStock,
  medicationActiveIngredients,
} from "@/db/schema/pharmacy";
import { TRPCError } from "@trpc/server";
import { splitSchema } from "@/types/medication-stock";
import { validateSplits } from "@/lib/utils/medication-stock";
import { MAX_SPLITS, MIN_SPLITS } from "@/lib/constants/medicationStock";

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
        medicationActiveIngredientId: medicationActiveIngredients.id,
        fallBelow: medicationActiveIngredients.fallBelow,
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

    const totals = new Map<number, number>();
    for (const item of result) {
      if (item.stockStatus !== "active") {
        continue;
      }
      const currentTotal = totals.get(item.medicationActiveIngredientId) || 0;
      totals.set(
        item.medicationActiveIngredientId,
        currentTotal + item.quantity,
      );
    }

    return result.map((item) => ({
      ...item,
      isLowStock:
        item.stockStatus === "active" &&
        (totals.get(item.medicationActiveIngredientId) ?? 0) <= item.fallBelow,
    }));
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
    .mutation(async ({ input, ctx }) => {
      return await withUserTransaction(ctx.user.id, async (tx) => {
        const [newStock] = await tx
          .insert(medicationStock)
          .values(input)
          .returning();

        return newStock;
      });
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
      return await withUserTransaction(ctx.user.id, async (tx) => {
        const { id, ...updateData } = input;
        const [result] = await tx
          .update(medicationStock)
          .set({ ...updateData })
          .where(eq(medicationStock.id, id))
          .returning();

        return result ? result : null;
      });
    }),

  createSplits: protectedProcedure
    .input(
      z.object({
        parentId: zfd.numeric(z.number().int()),
        splits: z.array(splitSchema).min(MIN_SPLITS).max(MAX_SPLITS),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { splits, parentId } = input;

      return await withUserTransaction(ctx.user.id, async (tx) => {
        const [parent] = await tx
          .select()
          .from(medicationStock)
          .where(eq(medicationStock.id, parentId))
          .for("update") // row-level lock
          .limit(1);

        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent stock item not found.",
          });
        }

        if (parent.quantity === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "The parent stock has already split.",
          });
        }

        const { success, message } = validateSplits(splits, parent.quantity);

        if (!success) {
          throw new TRPCError({
            code: "CONFLICT",
            message: message,
          });
        }

        await tx.insert(medicationStock).values(
          splits.map((s) => ({
            medicationBrandId: parent.medicationBrandId,
            expiry: parent.expiry,
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

        return { success: true };
      });
    }),
});
