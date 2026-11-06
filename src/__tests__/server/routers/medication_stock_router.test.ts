// @vitest-environment node
//
// Integration tests for the medication stock router and the
// `log_medication_stock_changes` audit trigger. These run against the local
// Supabase Postgres instance configured in .env so the trigger, the
// `get_current_user_id()` lookup and transaction rollback are exercised for real.
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied, and at least one auth.users row (`pnpm seed:users`).
//
// Runs in the node environment (not jsdom) because src/lib/envVariables.ts
// switches on `typeof window` and only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { randomInt, randomUUID } from "crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import { withUserTransaction } from "@/db/withUserTransaction";
import type { Context } from "@/server/context";
import { authUsers } from "@/db/schema";
import {
  medicationBrands,
  medicationStock,
  stockChanges,
  medicationActiveIngredients,
} from "@/db/schema/pharmacy";
import type { StockStatus } from "@/types/medication-stock";

// Sentinel expiry that marks rows created by this file (splits inherit it from
// their parent), so tests can find and clean up only their own stock.
const TEST_EXPIRY = new Date("2099-12-31");

const SEED_STOCK = {
  quantity: 100,
  expiry: TEST_EXPIRY,
  location: "Shelf A",
  stockStatus: "active",
  remarks: "initial remarks",
} as const;

// protectedProcedure only reads ctx.user, so a minimal context is enough.
function callerFor(userId: string) {
  return appRouter.createCaller({ user: { id: userId } } as unknown as Context);
}

describe("medicationStockRouter + stock change trigger (integration)", () => {
  let userId: string;
  let brandId: number;
  let caller: ReturnType<typeof callerFor>;

  // All stock rows created by this file, so tests can assert nothing was persisted.
  async function testStockRows() {
    return db
      .select()
      .from(medicationStock)
      .where(
        and(
          eq(medicationStock.medicationBrandId, brandId),
          eq(medicationStock.expiry, TEST_EXPIRY),
        ),
      )
      .orderBy(asc(medicationStock.id));
  }

  async function changesFor(stockId: number) {
    return db
      .select()
      .from(stockChanges)
      .where(eq(stockChanges.stockId, stockId))
      .orderBy(asc(stockChanges.id));
  }

  // Creates a stock row through the router (so its insert history is logged)
  // and returns it along with the number of history rows the insert produced.
  async function createStock(
    overrides: Partial<{
      quantity: number;
      location: string;
      remarks: string;
    }> = {},
  ) {
    const stock = await caller.medicationStockRouter.create({
      medicationBrandId: brandId,
      ...SEED_STOCK,
      ...overrides,
    });
    const insertChanges = await changesFor(stock.id);
    return { stock, insertChangeCount: insertChanges.length };
  }

  async function cleanUpStock() {
    const rows = await testStockRows();
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return;
    // stock_changes FK-references medication_stock, so delete history first.
    await db.delete(stockChanges).where(inArray(stockChanges.stockId, ids));
    await db.delete(medicationStock).where(inArray(medicationStock.id, ids));
  }

  beforeAll(async () => {
    // stock_changes FK-references auth.users; reuse an existing seeded user.
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

    // Reuse a seeded brand: the brand seed inserts explicit ids, so inserting
    // a new brand here can collide with the out-of-sync id sequence.
    const [brand] = await db
      .select({ id: medicationBrands.id })
      .from(medicationBrands)
      .limit(1);
    if (!brand) {
      throw new Error(
        "No medication_brands row found. Run `pnpm seed:db` against local " +
          "Supabase before running the router integration tests.",
      );
    }
    brandId = brand.id;

    caller = callerFor(userId);
  });

  afterEach(async () => {
    await cleanUpStock();
  });

  afterAll(async () => {
    await cleanUpStock();
  });

  describe("on insert", () => {
    it("logs every populated field against the acting user", async () => {
      const { stock } = await createStock();

      const changes = await changesFor(stock.id);
      expect(
        changes.map(({ field, previousValue, newValue }) => ({
          field,
          previousValue,
          newValue,
        })),
      ).toEqual([
        { field: "quantity", previousValue: "0", newValue: "100" },
        { field: "location", previousValue: "", newValue: "Shelf A" },
        { field: "stock_status", previousValue: "", newValue: "active" },
        { field: "remarks", previousValue: "", newValue: "initial remarks" },
      ]);
      expect(changes.every((c) => c.userId === userId)).toBe(true);
    });

    it("does not log remarks when they are omitted", async () => {
      const stock = await caller.medicationStockRouter.create({
        medicationBrandId: brandId,
        quantity: SEED_STOCK.quantity,
        expiry: SEED_STOCK.expiry,
        location: SEED_STOCK.location,
        stockStatus: SEED_STOCK.stockStatus,
      });

      const fields = (await changesFor(stock.id)).map((c) => c.field);
      expect(fields).toEqual(["quantity", "location", "stock_status"]);
    });
  });

  describe("on update", () => {
    it("logs only the fields that changed", async () => {
      const { stock, insertChangeCount } = await createStock();

      // remarks is passed unchanged so it should not be logged
      await caller.medicationStockRouter.update({
        id: stock.id,
        location: "Shelf B",
        remarks: SEED_STOCK.remarks,
      });

      const updateChanges = (await changesFor(stock.id)).slice(
        insertChangeCount,
      );
      expect(updateChanges).toHaveLength(1);
      expect(updateChanges[0]).toMatchObject({
        field: "location",
        previousValue: "Shelf A",
        newValue: "Shelf B",
        userId,
      });
    });

    it("logs one row per changed field with previous and new values", async () => {
      const { stock, insertChangeCount } = await createStock();

      await caller.medicationStockRouter.update({
        id: stock.id,
        location: "Shelf C",
        stockStatus: "discarded",
        remarks: "expired early",
      });

      const updateChanges = (await changesFor(stock.id)).slice(
        insertChangeCount,
      );
      expect(
        updateChanges.map(({ field, previousValue, newValue }) => ({
          field,
          previousValue,
          newValue,
        })),
      ).toEqual([
        { field: "location", previousValue: "Shelf A", newValue: "Shelf C" },
        {
          field: "stock_status",
          previousValue: "active",
          newValue: "discarded",
        },
        {
          field: "remarks",
          previousValue: "initial remarks",
          newValue: "expired early",
        },
      ]);
    });

    it("logs clearing remarks as a change to an empty string", async () => {
      const { stock, insertChangeCount } = await createStock();

      // An empty string is normalised to null by the router
      await caller.medicationStockRouter.update({ id: stock.id, remarks: "" });

      const updateChanges = (await changesFor(stock.id)).slice(
        insertChangeCount,
      );
      expect(updateChanges).toHaveLength(1);
      expect(updateChanges[0]).toMatchObject({
        field: "remarks",
        previousValue: "initial remarks",
        newValue: "",
      });
    });

    it("logs nothing when no values actually change", async () => {
      const { stock, insertChangeCount } = await createStock();

      await caller.medicationStockRouter.update({
        id: stock.id,
        location: SEED_STOCK.location,
        stockStatus: SEED_STOCK.stockStatus,
        remarks: SEED_STOCK.remarks,
      });

      expect(await changesFor(stock.id)).toHaveLength(insertChangeCount);
    });
  });

  describe("createSplits()", () => {
    it("logs the inserted splits and the parent quantity dropping to 0", async () => {
      const { stock: parent, insertChangeCount } = await createStock();

      await caller.medicationStockRouter.createSplits({
        parentId: parent.id,
        splits: [
          { quantity: 60, location: "Shelf D", stockStatus: "active" },
          { quantity: 40, location: "Shelf E", stockStatus: "reserved" },
        ],
      });

      const parentUpdateChanges = (await changesFor(parent.id)).slice(
        insertChangeCount,
      );
      expect(parentUpdateChanges).toHaveLength(1);
      expect(parentUpdateChanges[0]).toMatchObject({
        field: "quantity",
        previousValue: "100",
        newValue: "0",
        userId,
      });

      const children = (await testStockRows()).filter(
        (r) => r.id !== parent.id,
      );
      expect(children).toHaveLength(2);
      for (const child of children) {
        const quantityChange = (await changesFor(child.id)).find(
          (c) => c.field === "quantity",
        );
        expect(quantityChange).toMatchObject({
          previousValue: "0",
          newValue: String(child.quantity),
          userId,
        });
      }
    });

    it("rolls back the splits and their history when validation fails", async () => {
      const { stock: parent, insertChangeCount } = await createStock();

      // Split quantities exceed the parent's quantity
      await expect(
        caller.medicationStockRouter.createSplits({
          parentId: parent.id,
          splits: [
            { quantity: 80, location: "Shelf D", stockStatus: "active" },
            { quantity: 80, location: "Shelf E", stockStatus: "active" },
          ],
        }),
      ).rejects.toThrow();

      const rows = await testStockRows();
      expect(rows).toHaveLength(1);
      expect(rows[0].quantity).toBe(SEED_STOCK.quantity);
      expect(await changesFor(parent.id)).toHaveLength(insertChangeCount);
    });
  });

  describe("rollback", () => {
    it("saves neither the stock row nor its history when the transaction throws after an insert", async () => {
      await expect(
        withUserTransaction(userId, async (tx) => {
          await tx
            .insert(medicationStock)
            .values({ medicationBrandId: brandId, ...SEED_STOCK });
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      expect(await testStockRows()).toHaveLength(0);
    });

    it("reverts the update and its history when the transaction throws after an update", async () => {
      const { stock, insertChangeCount } = await createStock();

      await expect(
        withUserTransaction(userId, async (tx) => {
          await tx
            .update(medicationStock)
            .set({ location: "Shelf Z" })
            .where(eq(medicationStock.id, stock.id));
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      const [row] = await testStockRows();
      expect(row.location).toBe(SEED_STOCK.location);
      expect(await changesFor(stock.id)).toHaveLength(insertChangeCount);
    });

    it("does not save the stock row when writing its history fails", async () => {
      // A user id that is not in auth.users makes the trigger's insert into
      // stock_changes violate its foreign key
      await expect(
        callerFor(randomUUID()).medicationStockRouter.create({
          medicationBrandId: brandId,
          ...SEED_STOCK,
        }),
      ).rejects.toThrow();

      expect(await testStockRows()).toHaveLength(0);
    });
  });

  describe("user context", () => {
    it("rejects writes made without a user id", async () => {
      await expect(
        db
          .insert(medicationStock)
          .values({ medicationBrandId: brandId, ...SEED_STOCK }),
      ).rejects.toThrow();

      expect(await testStockRows()).toHaveLength(0);
    });

    it("falls back to the app.current_user_id setting", async () => {
      const stockId = await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
        );
        const [row] = await tx
          .insert(medicationStock)
          .values({ medicationBrandId: brandId, ...SEED_STOCK })
          .returning({ id: medicationStock.id });
        return row.id;
      });

      const changes = await changesFor(stockId);
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.every((c) => c.userId === userId)).toBe(true);
    });

    it("skips logging when app.bypass_triggers is set", async () => {
      const stockId = await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('app.bypass_triggers', 'true', true)`,
        );
        const [row] = await tx
          .insert(medicationStock)
          .values({ medicationBrandId: brandId, ...SEED_STOCK })
          .returning({ id: medicationStock.id });
        return row.id;
      });

      expect(await changesFor(stockId)).toHaveLength(0);
    });
  });
});

describe("medicationStockRouter low-stock flags (integration)", () => {
  let caller: ReturnType<typeof callerFor>;
  let ingredientA: number;
  let ingredientB: number;
  let brandA: number;
  let brandB: number;
  let brandC: number;

  const ingredientIds: number[] = [];
  const brandIds: number[] = [];

  // Negative IDs avoid collisions with seeded positive IDs and their sequences.
  async function createIngredient(fallBelow: number) {
    const [ingredient] = await db
      .insert(medicationActiveIngredients)
      .values({
        id: -randomInt(1, 2_147_483_647),
        name: `Low-stock test ${randomUUID()}`,
        unitOfMeasurement: "pill",
        fallBelow,
      })
      .returning();

    ingredientIds.push(ingredient.id);
    return ingredient.id;
  }

  async function createBrand(activeIngredientId: number) {
    const [brand] = await db
      .insert(medicationBrands)
      .values({
        id: -randomInt(1, 2_147_483_647),
        name: `Low-stock brand ${randomUUID()}`,
        activeIngredientId,
      })
      .returning();

    brandIds.push(brand.id);
    return brand.id;
  }

  async function createBatch(
    medicationBrandId: number,
    quantity: number,
    stockStatus: StockStatus = "active",
  ) {
    return caller.medicationStockRouter.create({
      ...SEED_STOCK,
      medicationBrandId,
      quantity,
      stockStatus,
    });
  }

  async function fetchBatches(ids: number[]) {
    const rows =
      await caller.medicationStockRouter.listWithBrandAndActiveIngredient();

    // Return only this test's records, in the requested order.
    return ids.map((id) => {
      const row = rows.find((item) => item.id === id);
      if (!row) {
        throw new Error(`Expected stock ${id} in query result`);
      }
      return row;
    });
  }

  async function cleanUpBatches() {
    if (brandIds.length === 0) return;

    const rows = await db
      .select({ id: medicationStock.id })
      .from(medicationStock)
      .where(inArray(medicationStock.medicationBrandId, brandIds));

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return;

    await db.delete(stockChanges).where(inArray(stockChanges.stockId, ids));
    await db.delete(medicationStock).where(inArray(medicationStock.id, ids));
  }

  beforeAll(async () => {
    const [user] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .limit(1);

    if (!user) {
      throw new Error("Run pnpm seed:users before these integration tests.");
    }

    caller = callerFor(user.id);

    ingredientA = await createIngredient(100);
    ingredientB = await createIngredient(50);

    brandA = await createBrand(ingredientA);
    brandB = await createBrand(ingredientA);
    brandC = await createBrand(ingredientB);
  });

  afterEach(async () => {
    await cleanUpBatches();

    // Restore the threshold changed by the threshold-update test.
    if (ingredientA !== undefined) {
      await db
        .update(medicationActiveIngredients)
        .set({ fallBelow: 100 })
        .where(eq(medicationActiveIngredients.id, ingredientA));
    }
  });

  afterAll(async () => {
    await cleanUpBatches();

    if (brandIds.length > 0) {
      await db
        .delete(medicationBrands)
        .where(inArray(medicationBrands.id, brandIds));
    }

    if (ingredientIds.length > 0) {
      await db
        .delete(medicationActiveIngredients)
        .where(inArray(medicationActiveIngredients.id, ingredientIds));
    }
  });

  it.each([
    { quantities: [40, 50], expected: true, label: "below" },
    { quantities: [40, 60], expected: true, label: "equal to" },
    { quantities: [60, 60], expected: false, label: "above" },
  ])(
    "flags batches correctly when their combined total is $label the threshold",
    async ({ quantities, expected }) => {
      const first = await createBatch(brandA, quantities[0]);
      const second = await createBatch(brandA, quantities[1]);

      const rows = await fetchBatches([first.id, second.id]);

      expect(rows.map((row) => row.isLowStock)).toEqual([expected, expected]);
    },
  );

  it("combines quantities across brands sharing an ingredient", async () => {
    const first = await createBatch(brandA, 60);
    const second = await createBatch(brandB, 60);

    const rows = await fetchBatches([first.id, second.id]);

    // Each batch is below 100, but their combined total is 120.
    expect(rows.map((row) => row.isLowStock)).toEqual([false, false]);
  });

  it("keeps totals and thresholds separate for different ingredients", async () => {
    const first = await createBatch(brandA, 60); // Threshold: 100
    const second = await createBatch(brandC, 60); // Threshold: 50

    const rows = await fetchBatches([first.id, second.id]);

    expect(rows.map((row) => row.isLowStock)).toEqual([true, false]);
  });

  it.each(["reserved", "dispensed", "donated", "discarded"] as const)(
    "excludes %s stock from totals and does not flag its row",
    async (status) => {
      const active = await createBatch(brandA, 40);
      const inactive = await createBatch(brandA, 1000, status);

      const rows = await fetchBatches([active.id, inactive.id]);

      expect(rows.map((row) => row.isLowStock)).toEqual([true, false]);
    },
  );

  it("does not flag stock when the ingredient has no active batches", async () => {
    const batch = await createBatch(brandA, 40, "reserved");

    const [row] = await fetchBatches([batch.id]);

    expect(row.isLowStock).toBe(false);
  });

  it("recalculates the flag after the ingredient threshold changes", async () => {
    const batch = await createBatch(brandA, 80);

    const [before] = await fetchBatches([batch.id]);
    expect(before.isLowStock).toBe(true);

    await db
      .update(medicationActiveIngredients)
      .set({ fallBelow: 50 })
      .where(eq(medicationActiveIngredients.id, ingredientA));

    const [after] = await fetchBatches([batch.id]);
    expect(after.isLowStock).toBe(false);
  });
});
