import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { withUserTransaction } from "@/db/withUserTransaction";
import { db } from "@/db/drizzle";
import { eq, and, gt, gte, asc, inArray } from "drizzle-orm";
import {
  medicationActiveIngredients,
  medicationBrands,
  medicationStock,
  orders,
  orderItems,
} from "@/db/schema/pharmacy";
import { consults, diagnosis } from "@/db/schema/consults";
import { patients, visits } from "@/db/schema/patients";
import { villageCodes } from "@/db/schema/villageCodes";
import { TRPCError } from "@trpc/server";
import { allocateStock } from "@/lib/utils/medication-stock";
import { getPatientWithImageUrl } from "@/server/utils/cloudinary";

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

/**
 * Input for resolving a pending order from the orders page.
 * APPROVED dispenses the order's reserved stock; CANCELLED returns it to active.
 */
const resolveOrderInput = z.object({
  orderId: z.number().int().positive(),
  status: z.enum(["APPROVED", "CANCELLED"]),
});

/** Stock status the order's reserved stock moves to when the order is resolved. */
const RESOLVED_STOCK_STATUS = {
  APPROVED: "dispensed",
  CANCELLED: "active",
} as const;

type PendingOrder = {
  id: number;
  quantity: number;
  dosageInstructions: string;
  /** Null when the order reserved no stock (e.g. a migrated legacy order). */
  activeIngredientName: string | null;
  unitOfMeasurement: string | null;
  items: {
    stockId: number;
    brandName: string;
    expiry: Date;
    location: string;
    quantity: number;
  }[];
};

type PendingVisit = {
  visitId: number;
  visitDate: Date;
  patientId: number;
  patientName: string;
  patientImageUrl: string | null;
  villageCode: string;
  villageColorHex: string;
  diagnoses: { id: number; details: string; category: string | null }[];
  orders: PendingOrder[];
};

export const ordersRouter = router({
  /**
   * Lists every visit with at least one PENDING order, oldest visit first.
   *
   * Each visit carries its patient, the diagnoses from all of its consults and
   * its pending orders. An order's medication is read from the stock it
   * reserved, so each order lists the brand, location and quantity of every
   * reserved stock row.
   */
  listPending: protectedProcedure.query(async (): Promise<PendingVisit[]> => {
    const pendingOrders = await db
      .select({
        orderId: orders.id,
        quantity: orders.quantity,
        dosageInstructions: orders.dosageInstructions,
        visitId: visits.id,
        visitDate: visits.date,
        patientId: patients.id,
        patientName: patients.name,
        patientImagePublicId: patients.patientImagePublicId,
        villageCode: villageCodes.code,
        villageColorHex: villageCodes.colorHex,
      })
      .from(orders)
      .innerJoin(consults, eq(orders.consultId, consults.id))
      .innerJoin(visits, eq(consults.visitId, visits.id))
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .innerJoin(villageCodes, eq(visits.villageCodeId, villageCodes.id))
      .where(eq(orders.status, "PENDING"))
      .orderBy(asc(visits.date), asc(visits.id), asc(orders.id));

    if (pendingOrders.length === 0) return [];

    const orderIds = pendingOrders.map((order) => order.orderId);
    const visitIds = [...new Set(pendingOrders.map((order) => order.visitId))];

    const [items, visitDiagnoses] = await Promise.all([
      db
        .select({
          orderId: orderItems.orderId,
          stockId: medicationStock.id,
          quantity: medicationStock.quantity,
          expiry: medicationStock.expiry,
          location: medicationStock.location,
          brandName: medicationBrands.name,
          activeIngredientName: medicationActiveIngredients.name,
          unitOfMeasurement: medicationActiveIngredients.unitOfMeasurement,
        })
        .from(orderItems)
        .innerJoin(medicationStock, eq(orderItems.stockId, medicationStock.id))
        .innerJoin(
          medicationBrands,
          eq(medicationStock.medicationBrandId, medicationBrands.id),
        )
        .innerJoin(
          medicationActiveIngredients,
          eq(
            medicationBrands.activeIngredientId,
            medicationActiveIngredients.id,
          ),
        )
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(medicationStock.expiry), asc(medicationStock.id)),
      db
        .select({
          id: diagnosis.id,
          details: diagnosis.details,
          category: diagnosis.category,
          visitId: consults.visitId,
        })
        .from(diagnosis)
        .innerJoin(consults, eq(diagnosis.consultId, consults.id))
        .where(inArray(consults.visitId, visitIds))
        .orderBy(asc(consults.date), asc(diagnosis.id)),
    ]);

    // Map keeps insertion order, so visits stay oldest first.
    const visitsById = new Map<number, PendingVisit>();
    for (const order of pendingOrders) {
      let visit = visitsById.get(order.visitId);
      if (!visit) {
        const { patientImageUrl } = getPatientWithImageUrl(order);
        visit = {
          visitId: order.visitId,
          visitDate: order.visitDate,
          patientId: order.patientId,
          patientName: order.patientName,
          patientImageUrl,
          villageCode: order.villageCode,
          villageColorHex: order.villageColorHex,
          diagnoses: visitDiagnoses
            .filter((d) => d.visitId === order.visitId)
            .map(({ id, details, category }) => ({ id, details, category })),
          orders: [],
        };
        visitsById.set(order.visitId, visit);
      }

      const reserved = items.filter((item) => item.orderId === order.orderId);
      visit.orders.push({
        id: order.orderId,
        quantity: order.quantity,
        dosageInstructions: order.dosageInstructions,
        activeIngredientName: reserved[0]?.activeIngredientName ?? null,
        unitOfMeasurement: reserved[0]?.unitOfMeasurement ?? null,
        items: reserved.map(
          ({ stockId, brandName, expiry, location, quantity }) => ({
            stockId,
            brandName,
            expiry,
            location,
            quantity,
          }),
        ),
      });
    }

    return [...visitsById.values()];
  }),

  /**
   * Approves or cancels a PENDING order and moves its reserved stock along:
   *  - APPROVED: reserved stock -> dispensed
   *  - CANCELLED: reserved stock -> active (back on the shelf)
   *
   * Runs as the user so the stock audit trigger records who resolved it.
   * Throws CONFLICT if the order has already been resolved.
   */
  resolve: protectedProcedure
    .input(resolveOrderInput)
    .mutation(async ({ input, ctx }) => {
      return await withUserTransaction(ctx.appUser.id, async (tx) => {
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .for("update"); // lock so two pharmacists can't resolve it twice

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.status !== "PENDING") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Order is already ${order.status.toLowerCase()}`,
          });
        }

        await tx
          .update(medicationStock)
          .set({ stockStatus: RESOLVED_STOCK_STATUS[input.status] })
          .where(
            and(
              eq(medicationStock.stockStatus, "reserved"),
              inArray(
                medicationStock.id,
                tx
                  .select({ id: orderItems.stockId })
                  .from(orderItems)
                  .where(eq(orderItems.orderId, order.id)),
              ),
            ),
          );

        const [updated] = await tx
          .update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, order.id))
          .returning();

        return updated;
      });
    }),

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
      return await withUserTransaction(ctx.appUser.id, async (tx) => {
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

        const allocation = allocateStock(candidates, input.quantity);

        if (!allocation.success) {
          throw new TRPCError({
            code: "CONFLICT",
            message: allocation.message,
          });
        }

        const { wholeStockIds, partial } = allocation;
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
