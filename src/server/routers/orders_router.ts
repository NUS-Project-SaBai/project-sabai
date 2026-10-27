import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { withUserTransaction } from "@/db/withUserTransaction";
import { eq, and, gt, gte, asc, inArray } from "drizzle-orm";
import {
  medicationBrands,
  medicationStock,
  orders,
  orderItems,
  type MedicationStock,
} from "@/db/schema/pharmacy";
import { TRPCError } from "@trpc/server";

/**
 * Input for placing an order from the consult form.
 * An active ingredient is picked and the stock is consumed by expiry date (expiring earliest first)
 */
const createOrderInput = z.object({
  consultId: z.number().int().positive(),
  activeIngredientId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  dosageInstructions: z.string().trim().min(1),
});

export const ordersRouter = router({
  /**
   * Places an order against the available stock of one active ingredient.
   *
   * Allocation walks the active, unexpired stock of the specified active ingredient
   *  - stock fully consumed by the order is toggled active -> reserved
   *  - the final stock, if only partly consumed, is split the same way
   *    `medicationStockRouter.createSplits` (parent set to 0, qty of child stocks = qty of parent stock)
   *
   * Each reserved stock is recorded in `order_items`. Reserved stock is not
   * editable, so its quantity is the amount it contributed to the order.
   */
  create: protectedProcedure
    .input(createOrderInput)
    .mutation(async ({ input, ctx }) => {
      return await withUserTransaction(ctx.user.id, async (tx) => {
        // The brand filter is a subquery rather than a join to keep FOR UPDATE
        // off the medication_brands rows.
        const candidates = await tx
          .select()
          .from(medicationStock)
          .where(
            and(
              eq(medicationStock.stockStatus, "active"),
              gt(medicationStock.quantity, 0),
              gte(medicationStock.expiry, new Date()),
              inArray(
                medicationStock.medicationBrandId,
                tx
                  .select({ id: medicationBrands.id })
                  .from(medicationBrands)
                  .where(
                    eq(
                      medicationBrands.activeIngredientId,
                      input.activeIngredientId,
                    ),
                  ),
              ),
            ),
          )
          .orderBy(asc(medicationStock.expiry), asc(medicationStock.id))
          .for("update"); // lock

        let outstanding = input.quantity;
        const wholeStockIds: number[] = [];
        let partial: { stock: MedicationStock; take: number } | null = null;

        for (const stock of candidates) {
          if (outstanding === 0) break;

          if (stock.quantity <= outstanding) {
            wholeStockIds.push(stock.id);
            outstanding -= stock.quantity;
          } else {
            partial = { stock, take: outstanding };
            outstanding = 0;
          }
        }

        if (outstanding > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Insufficient stock: ${input.quantity - outstanding} of ${input.quantity} available.`,
          });
        }

        const reservedStockIds: number[] = [];

        if (wholeStockIds.length > 0) {
          await tx
            .update(medicationStock)
            .set({ stockStatus: "reserved" })
            .where(inArray(medicationStock.id, wholeStockIds));

          reservedStockIds.push(...wholeStockIds);
        }

        if (partial) {
          const { stock, take } = partial;

          const [reservedChild] = await tx
            .insert(medicationStock)
            .values([
              {
                medicationBrandId: stock.medicationBrandId,
                expiry: stock.expiry,
                quantity: take,
                location: stock.location,
                stockStatus: "reserved" as const,
                remarks: stock.remarks,
              },
              {
                medicationBrandId: stock.medicationBrandId,
                expiry: stock.expiry,
                quantity: stock.quantity - take,
                location: stock.location,
                stockStatus: "active" as const,
                remarks: stock.remarks,
              },
            ])
            .returning();

          // Parent qty set to 0 (like createsplits)
          await tx
            .update(medicationStock)
            .set({ quantity: 0 })
            .where(eq(medicationStock.id, stock.id));

          reservedStockIds.push(reservedChild.id);
        }

        const [order] = await tx
          .insert(orders)
          .values({
            consultId: input.consultId,
            dosageInstructions: input.dosageInstructions,
            quantity: input.quantity,
          })
          .returning();

        await tx
          .insert(orderItems)
          .values(
            reservedStockIds.map((stockId) => ({ orderId: order.id, stockId })),
          );

        return order;
      });
    }),
});
