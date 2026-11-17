// @vitest-environment node
//
// Integration tests for listing and resolving pending orders. These run
// against the local Supabase Postgres instance configured in .env so the
// joins, row locks and the stock audit trigger are exercised for real.
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied, and at least one auth.users row (`pnpm seed:users`).
//
// Runs in the node environment (not jsdom) because src/lib/envVariables.ts
// switches on `typeof window` and only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { randomInt, randomUUID } from "crypto";
import { asc, eq, inArray } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import { withUserTransaction } from "@/db/withUserTransaction";
import type { Context } from "@/server/context";
import {
  authUsers,
  consults,
  diagnosis,
  medicationActiveIngredients,
  medicationBrands,
  medicationStock,
  orderItems,
  orders,
  patients,
  stockChanges,
  villageCodes,
  visits,
} from "@/db/schema";

const SEED_PATIENT = {
  name: "Orders Test Patient",
  gender: "female",
  drugAllergy: "NKDA",
  dateOfBirth: new Date("1990-01-01"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "test/placeholder",
} as const;

const VILLAGE_CODE = {
  code: "SATOR",
  name: "SATOR Village",
  colorHex: "#27AE60",
};

// Sentinel expiry so the stock this file creates is easy to tell apart.
const TEST_EXPIRY = new Date("2099-12-31");

// protectedProcedure only reads ctx.user, so a minimal context is enough.
function callerFor(userId: string) {
  return appRouter.createCaller({ user: { id: userId } } as unknown as Context);
}

describe("ordersRouter listPending / resolve (integration)", () => {
  let userId: string;
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;
  let consultIds: number[];
  let ingredientId: number;
  let ingredientName: string;
  let brandId: number;
  let brandName: string;
  let caller: ReturnType<typeof callerFor>;

  async function stockForBrand() {
    return db
      .select()
      .from(medicationStock)
      .where(eq(medicationStock.medicationBrandId, brandId))
      .orderBy(asc(medicationStock.id));
  }

  async function seedStock(quantity: number, location: string) {
    return withUserTransaction(userId, async (tx) => {
      const [stock] = await tx
        .insert(medicationStock)
        .values({
          medicationBrandId: brandId,
          quantity,
          expiry: TEST_EXPIRY,
          location,
          stockStatus: "active",
        })
        .returning();
      return stock;
    });
  }

  async function placeOrder(quantity: number, consultId = consultIds[0]) {
    return caller.ordersRouter.create({
      consultId,
      activeIngredientId: ingredientId,
      quantity,
      dosageInstructions: "1 tab daily",
    });
  }

  async function findVisit() {
    const rows = await caller.ordersRouter.listPending();
    return rows.find((row) => row.visitId === visitId);
  }

  async function cleanUpOrdersAndStock() {
    const orderRows = await db
      .select({ id: orders.id })
      .from(orders)
      .where(inArray(orders.consultId, consultIds));
    const orderIds = orderRows.map((row) => row.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
      await db.delete(orders).where(inArray(orders.id, orderIds));
    }

    const stockIds = (await stockForBrand()).map((row) => row.id);
    if (stockIds.length > 0) {
      await db
        .delete(stockChanges)
        .where(inArray(stockChanges.stockId, stockIds));
      await db
        .delete(medicationStock)
        .where(inArray(medicationStock.id, stockIds));
    }
  }

  beforeAll(async () => {
    const [user] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .limit(1);
    if (!user) {
      throw new Error(
        "No auth.users row found. Run `pnpm seed:all` against local Supabase " +
          "before running the router integration tests.",
      );
    }
    userId = user.id;
    caller = callerFor(userId);

    [{ id: villageCodeId }] = await db
      .insert(villageCodes)
      .values(VILLAGE_CODE)
      .returning({ id: villageCodes.id });

    [{ id: patientId }] = await db
      .insert(patients)
      .values(SEED_PATIENT)
      .returning({ id: patients.id });

    [{ id: visitId }] = await db
      .insert(visits)
      .values({ patientId, villageCodeId })
      .returning({ id: visits.id });

    // Two consults in the same visit, to check both feed the one visit row.
    const consultRows = await db
      .insert(consults)
      .values([
        { doctorId: userId, visitId, date: new Date("2026-10-07T09:00:00Z") },
        { doctorId: userId, visitId, date: new Date("2026-10-07T10:00:00Z") },
      ])
      .returning({ id: consults.id });
    consultIds = consultRows.map((row) => row.id);

    await db.insert(diagnosis).values([
      { consultId: consultIds[0], category: "Dermatology", details: "Rash" },
      { consultId: consultIds[1], category: null, details: "Cough" },
    ]);

    // High random IDs avoid collisions with seeded IDs and their sequences
    // (orders.create only accepts positive ingredient IDs).
    ingredientName = `Orders test ${randomUUID()}`;
    [{ id: ingredientId }] = await db
      .insert(medicationActiveIngredients)
      .values({
        id: randomInt(1_000_000_000, 2_147_483_647),
        name: ingredientName,
        unitOfMeasurement: "tablets",
        fallBelow: 0,
      })
      .returning({ id: medicationActiveIngredients.id });

    brandName = `Orders brand ${randomUUID()}`;
    [{ id: brandId }] = await db
      .insert(medicationBrands)
      .values({
        id: randomInt(1_000_000_000, 2_147_483_647),
        name: brandName,
        activeIngredientId: ingredientId,
      })
      .returning({ id: medicationBrands.id });
  });

  afterEach(async () => {
    await cleanUpOrdersAndStock();
  });

  afterAll(async () => {
    await cleanUpOrdersAndStock();
    await db.delete(diagnosis).where(inArray(diagnosis.consultId, consultIds));
    await db.delete(consults).where(inArray(consults.id, consultIds));
    await db.delete(visits).where(eq(visits.id, visitId));
    await db.delete(patients).where(eq(patients.id, patientId));
    await db.delete(villageCodes).where(eq(villageCodes.id, villageCodeId));
    await db.delete(medicationBrands).where(eq(medicationBrands.id, brandId));
    await db
      .delete(medicationActiveIngredients)
      .where(eq(medicationActiveIngredients.id, ingredientId));
  });

  describe("listPending()", () => {
    it("omits visits without pending orders", async () => {
      // Given - the visit has diagnoses but no orders
      // When / Then - it is not listed
      expect(await findVisit()).toBeUndefined();
    });

    it("groups the pending orders and diagnoses of every consult in the visit", async () => {
      // Given - one order in each of the visit's two consults
      await seedStock(100, "Shelf A");
      const first = await placeOrder(10, consultIds[0]);
      const second = await placeOrder(5, consultIds[1]);

      // When
      const visit = await findVisit();

      // Then - one row for the visit, with the patient, both diagnoses and both orders
      expect(visit).toBeDefined();
      expect(visit!.patientId).toBe(patientId);
      expect(visit!.patientName).toBe(SEED_PATIENT.name);
      expect(visit!.villageCode).toBe(VILLAGE_CODE.code);
      expect(visit!.villageColorHex).toBe(VILLAGE_CODE.colorHex);
      expect(visit!.patientImageUrl).toContain(
        SEED_PATIENT.patientImagePublicId,
      );
      expect(visit!.diagnoses.map((d) => [d.category, d.details])).toEqual([
        ["Dermatology", "Rash"],
        [null, "Cough"],
      ]);
      expect(visit!.orders.map((o) => o.id)).toEqual([first.id, second.id]);
      expect(visit!.orders[0]).toMatchObject({
        quantity: 10,
        dosageInstructions: "1 tab daily",
        activeIngredientName: ingredientName,
        unitOfMeasurement: "tablets",
      });
    });

    it("lists each reserved stock with its brand, location and quantity", async () => {
      // Given - an order that drains one stock and splits another
      await seedStock(4, "Shelf A");
      await seedStock(20, "Shelf B");
      await placeOrder(10);

      // When
      const visit = await findVisit();

      // Then - both reserved stocks are listed with the amount each contributes
      expect(
        visit!.orders[0].items.map(
          ({ brandName, expiry, location, quantity }) => ({
            brandName,
            expiry,
            location,
            quantity,
          }),
        ),
      ).toEqual([
        { brandName, expiry: TEST_EXPIRY, location: "Shelf A", quantity: 4 },
        { brandName, expiry: TEST_EXPIRY, location: "Shelf B", quantity: 6 },
      ]);
    });

    it("drops orders once they are resolved", async () => {
      // Given - two pending orders, one of which is approved
      await seedStock(100, "Shelf A");
      const approved = await placeOrder(10);
      const pending = await placeOrder(5);
      await caller.ordersRouter.resolve({
        orderId: approved.id,
        status: "APPROVED",
      });

      // When
      const visit = await findVisit();

      // Then - only the still-pending order is listed
      expect(visit!.orders.map((o) => o.id)).toEqual([pending.id]);
    });
  });

  describe("resolve()", () => {
    it("approves the order and dispenses its reserved stock", async () => {
      // Given - an order reserving part of a stock
      await seedStock(100, "Shelf A");
      const order = await placeOrder(10);
      const [item] = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // When
      const result = await caller.ordersRouter.resolve({
        orderId: order.id,
        status: "APPROVED",
      });

      // Then - the order is approved, its stock dispensed and the change audited
      expect(result.status).toBe("APPROVED");
      const [stock] = await db
        .select()
        .from(medicationStock)
        .where(eq(medicationStock.id, item.stockId));
      expect(stock.stockStatus).toBe("dispensed");
      expect(stock.quantity).toBe(10);

      const changes = await db
        .select()
        .from(stockChanges)
        .where(eq(stockChanges.stockId, item.stockId));
      expect(changes).toContainEqual(
        expect.objectContaining({
          field: "stock_status",
          previousValue: "reserved",
          newValue: "dispensed",
          userId,
        }),
      );
    });

    it("cancels the order and returns its reserved stock to active", async () => {
      // Given - an order reserving a whole stock
      const seeded = await seedStock(10, "Shelf A");
      const order = await placeOrder(10);

      // When
      const result = await caller.ordersRouter.resolve({
        orderId: order.id,
        status: "CANCELLED",
      });

      // Then - the order is cancelled and the stock is back on the shelf
      expect(result.status).toBe("CANCELLED");
      const [stock] = await db
        .select()
        .from(medicationStock)
        .where(eq(medicationStock.id, seeded.id));
      expect(stock.stockStatus).toBe("active");
      expect(stock.quantity).toBe(10);
    });

    it("leaves other stock alone", async () => {
      // Given - an order that splits a stock, leaving an active remainder
      await seedStock(100, "Shelf A");
      const order = await placeOrder(10);
      const before = await stockForBrand();

      // When
      await caller.ordersRouter.resolve({
        orderId: order.id,
        status: "APPROVED",
      });

      // Then - only the reserved split changes status
      const after = await stockForBrand();
      const changed = after.filter(
        (row, i) => row.stockStatus !== before[i].stockStatus,
      );
      expect(changed).toHaveLength(1);
      expect(changed[0].quantity).toBe(10);
    });

    it("rejects an order that is no longer pending", async () => {
      // Given - an order that was already cancelled
      await seedStock(100, "Shelf A");
      const order = await placeOrder(10);
      await caller.ordersRouter.resolve({
        orderId: order.id,
        status: "CANCELLED",
      });

      // When / Then - approving it now is a conflict, and the stock stays active
      await expect(
        caller.ordersRouter.resolve({ orderId: order.id, status: "APPROVED" }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      const stock = await stockForBrand();
      expect(stock.some((row) => row.stockStatus === "dispensed")).toBe(false);
    });

    it("rejects an unknown order", async () => {
      await expect(
        caller.ordersRouter.resolve({
          orderId: 2_147_483_647,
          status: "APPROVED",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
