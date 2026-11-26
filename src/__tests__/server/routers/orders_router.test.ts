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
import { getLinkedTestUser } from "./testUsers";

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

// village_codes.code is unique, so suffix it per run: a fixed code collides
// with rows left behind by an earlier run that failed before teardown.
const VILLAGE_CODE_SUFFIX = randomUUID().slice(0, 8);
const VILLAGE_CODE = {
  code: `ORDTEST-${VILLAGE_CODE_SUFFIX}`,
  name: `Orders Test Village ${VILLAGE_CODE_SUFFIX}`,
  colorHex: "#27AE60",
};

// Sentinel expiry so the stock this file creates is easy to tell apart.
const TEST_EXPIRY = new Date("2099-12-31");
const EARLIER_TEST_EXPIRY = new Date("2099-06-30");

// Dates of the visits used by the ordering tests, in insertion order. They are
// inserted out of date order so visit id order and visit date order disagree:
// [late (lowest id), early, late (highest id)].
const ORDERING_VISIT_DATES = [
  new Date("2026-10-14T09:00:00Z"),
  new Date("2026-10-07T09:00:00Z"),
  new Date("2026-10-14T09:00:00Z"),
];

// protectedProcedure only reads ctx.user (the auth user id) and looks up the
// linked public.users row itself, so a minimal context is enough.
function callerFor(authUserId: string) {
  return appRouter.createCaller({
    user: { id: authUserId },
  } as unknown as Context);
}

describe("ordersRouter listPending / resolve (integration)", () => {
  // Left undefined/empty until beforeAll creates them, so teardown can skip
  // whatever a partially failed setup never inserted.
  let userId: string;
  let villageCodeId: number | undefined;
  let patientId: number | undefined;
  let visitId: number | undefined;
  let consultIds: number[] = [];
  let ingredientId: number | undefined;
  let ingredientName: string;
  let brandId: number | undefined;
  let brandName: string;
  let caller: ReturnType<typeof callerFor>;
  // Visits for the ordering tests (same patient), each with the consult that
  // orders are placed against. In ORDERING_VISIT_DATES order.
  const orderingVisits: { visitId: number; consultId: number }[] = [];
  // Every consult in the ordering visits, for teardown.
  const orderingConsultIds: number[] = [];

  async function stockForBrand() {
    return db
      .select()
      .from(medicationStock)
      .where(eq(medicationStock.medicationBrandId, brandId!))
      .orderBy(asc(medicationStock.id));
  }

  async function seedStock(
    quantity: number,
    location: string,
    expiry = TEST_EXPIRY,
  ) {
    return withUserTransaction(userId, async (tx) => {
      const [stock] = await tx
        .insert(medicationStock)
        .values({
          medicationBrandId: brandId!,
          quantity,
          expiry,
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
      activeIngredientId: ingredientId!,
      quantity,
      dosageInstructions: "1 tab daily",
    });
  }

  async function findVisit() {
    const rows = await caller.ordersRouter.listPending();
    return rows.find((row) => row.visitId === visitId);
  }

  async function cleanUpOrdersAndStock() {
    const allConsultIds = [...consultIds, ...orderingConsultIds];
    if (allConsultIds.length > 0) {
      const orderRows = await db
        .select({ id: orders.id })
        .from(orders)
        .where(inArray(orders.consultId, allConsultIds));
      const orderIds = orderRows.map((row) => row.id);
      if (orderIds.length > 0) {
        await db
          .delete(orderItems)
          .where(inArray(orderItems.orderId, orderIds));
        await db.delete(orders).where(inArray(orders.id, orderIds));
      }
    }

    if (brandId === undefined) return;
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
    // userId (public.users) goes on FKs and is what the stock audit records;
    // the auth user id goes in ctx.user, which protectedProcedure resolves.
    const testUser = await getLinkedTestUser();
    userId = testUser.userId;
    caller = callerFor(testUser.authUserId);

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

    // Inserted one at a time so the ids follow ORDERING_VISIT_DATES order.
    for (const date of ORDERING_VISIT_DATES) {
      const [{ id: orderingVisitId }] = await db
        .insert(visits)
        .values({ patientId, villageCodeId, date })
        .returning({ id: visits.id });
      const [{ id: consultId }] = await db
        .insert(consults)
        .values({ doctorId: userId, visitId: orderingVisitId, date })
        .returning({ id: consults.id });
      orderingVisits.push({ visitId: orderingVisitId, consultId });
      orderingConsultIds.push(consultId);
    }

    // A second consult in the early visit, dated before its first consult but
    // inserted after it, so consult date order and diagnosis id order disagree.
    const earlyVisit = orderingVisits[1];
    const [{ id: earlierConsultId }] = await db
      .insert(consults)
      .values({
        doctorId: userId,
        visitId: earlyVisit.visitId,
        date: new Date("2026-10-07T08:00:00Z"),
      })
      .returning({ id: consults.id });
    orderingConsultIds.push(earlierConsultId);
    for (const [consultId, details] of [
      [earlyVisit.consultId, "Later consult, first diagnosis"],
      [earlyVisit.consultId, "Later consult, second diagnosis"],
      [earlierConsultId, "Earlier consult"],
    ] as const) {
      await db.insert(diagnosis).values({ consultId, category: null, details });
    }

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
    const allConsultIds = [...consultIds, ...orderingConsultIds];
    if (allConsultIds.length > 0) {
      await db
        .delete(diagnosis)
        .where(inArray(diagnosis.consultId, allConsultIds));
      await db.delete(consults).where(inArray(consults.id, allConsultIds));
    }
    const allVisitIds = [
      ...(visitId !== undefined ? [visitId] : []),
      ...orderingVisits.map((visit) => visit.visitId),
    ];
    if (allVisitIds.length > 0) {
      await db.delete(visits).where(inArray(visits.id, allVisitIds));
    }
    if (patientId !== undefined) {
      await db.delete(patients).where(eq(patients.id, patientId));
    }
    if (villageCodeId !== undefined) {
      await db.delete(villageCodes).where(eq(villageCodes.id, villageCodeId));
    }
    if (brandId !== undefined) {
      await db.delete(medicationBrands).where(eq(medicationBrands.id, brandId));
    }
    if (ingredientId !== undefined) {
      await db
        .delete(medicationActiveIngredients)
        .where(eq(medicationActiveIngredients.id, ingredientId));
    }
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

  describe("listPending() ordering", () => {
    // The ordering visits as listed, ignoring any other pending visits in the DB.
    async function listedOrderingVisits() {
      const ids = new Set(orderingVisits.map((visit) => visit.visitId));
      const rows = await caller.ordersRouter.listPending();
      return rows.filter((row) => ids.has(row.visitId));
    }

    /** One order per ordering visit, returned in ORDERING_VISIT_DATES order. */
    async function placeOrderInEveryOrderingVisit() {
      await seedStock(100, "Shelf A");
      const placed = [];
      for (const { consultId } of orderingVisits) {
        placed.push(await placeOrder(1, consultId));
      }
      return placed;
    }

    it("lists visits oldest first, by visit date rather than visit id", async () => {
      // Given - the early visit was inserted after a later-dated visit
      await placeOrderInEveryOrderingVisit();
      const [late, early] = orderingVisits;

      // When
      const listed = await listedOrderingVisits();

      // Then - the early visit comes first despite its higher id
      expect(listed.map((row) => row.visitId).slice(0, 2)).toEqual([
        early.visitId,
        late.visitId,
      ]);
    });

    it("breaks ties on visit date by visit id", async () => {
      // Given - two visits on the same date
      await placeOrderInEveryOrderingVisit();
      const [lateLowerId, , lateHigherId] = orderingVisits;

      // When
      const listed = await listedOrderingVisits();

      // Then - the lower id comes first
      expect(listed.map((row) => row.visitId).slice(1)).toEqual([
        lateLowerId.visitId,
        lateHigherId.visitId,
      ]);
    });

    it("lists each visit of the same patient separately, with its own orders", async () => {
      // Given - one order in each of the patient's three visits
      const [lateLowerIdOrder, earlyOrder, lateHigherIdOrder] =
        await placeOrderInEveryOrderingVisit();

      // When
      const listed = await listedOrderingVisits();

      // Then - three entries for one patient, each holding only its own order
      expect(listed).toHaveLength(3);
      expect(listed.every((row) => row.patientId === patientId)).toBe(true);
      expect(listed.map((row) => row.orders.map((o) => o.id))).toEqual([
        [earlyOrder.id],
        [lateLowerIdOrder.id],
        [lateHigherIdOrder.id],
      ]);
    });

    it("lists a visit's orders by order id, not by consult date", async () => {
      // Given - an order in the later consult is placed before one in the earlier consult
      await seedStock(100, "Shelf A");
      const first = await placeOrder(10, consultIds[1]);
      const second = await placeOrder(5, consultIds[0]);

      // When
      const visit = await findVisit();

      // Then - orders follow their ids
      expect(visit!.orders.map((o) => o.id)).toEqual([first.id, second.id]);
    });

    it("lists a visit's diagnoses by consult date, then diagnosis id", async () => {
      // Given - the early visit's earlier consult has the highest diagnosis id
      await placeOrderInEveryOrderingVisit();
      const earlyVisitId = orderingVisits[1].visitId;

      // When
      const listed = await listedOrderingVisits();
      const earlyVisit = listed.find((row) => row.visitId === earlyVisitId);

      // Then - the earlier consult's diagnosis comes first, then the rest by id
      expect(earlyVisit!.diagnoses.map((d) => d.details)).toEqual([
        "Earlier consult",
        "Later consult, first diagnosis",
        "Later consult, second diagnosis",
      ]);
    });

    it("lists an order's reserved stock by expiry, not by stock id", async () => {
      // Given - the later-expiring stock has the lower id; the order reserves both whole
      await seedStock(5, "Shelf A", TEST_EXPIRY);
      await seedStock(5, "Shelf B", EARLIER_TEST_EXPIRY);
      await placeOrder(10);

      // When
      const visit = await findVisit();

      // Then - the earlier-expiring stock comes first
      expect(
        visit!.orders[0].items.map(({ location, expiry }) => ({
          location,
          expiry,
        })),
      ).toEqual([
        { location: "Shelf B", expiry: EARLIER_TEST_EXPIRY },
        { location: "Shelf A", expiry: TEST_EXPIRY },
      ]);
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
