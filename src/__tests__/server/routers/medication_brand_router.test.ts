// @vitest-environment node
// Integration tests against local Supabase. Requires migrated tables, a seeded
// auth user, and the medication_brands ID sequence synchronized after seeding.
// src/test-setup.ts refuses to run these tests against a non-local database.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { randomInt, randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import type { Context } from "@/server/context";
import { db } from "@/db/drizzle";
import { authUsers } from "@/db/schema";
import {
  medicationActiveIngredients,
  medicationBrands,
  medicationStock,
  stockChanges,
  type MedicationActiveIngredient,
} from "@/db/schema/pharmacy";

function callerFor(userId: string) {
  return appRouter.createCaller({ user: { id: userId } } as unknown as Context);
}

describe("medicationBrandRouter (integration)", () => {
  const prefix = `brand-test-${randomUUID()}`;
  const ingredients: MedicationActiveIngredient[] = [];
  let caller: ReturnType<typeof callerFor>;

  async function createIngredient(unitOfMeasurement: string) {
    // Explicit fixture IDs avoid the ingredient seed's unsynchronized sequence.
    // Brand creation still goes through the real router and its default ID.
    const [ingredient] = await db
      .insert(medicationActiveIngredients)
      .values({
        id: randomInt(1_000_000_000, 2_000_000_000),
        name: `${prefix}-${unitOfMeasurement}`,
        unitOfMeasurement,
        fallBelow: 10,
      })
      .returning();
    ingredients.push(ingredient);
    return ingredient;
  }

  async function testBrands() {
    if (ingredients.length === 0) return [];
    return db
      .select()
      .from(medicationBrands)
      .where(
        inArray(
          medicationBrands.activeIngredientId,
          ingredients.map(({ id }) => id),
        ),
      );
  }

  async function createBrand() {
    return caller.medicationBrandRouter.create({
      name: `${prefix}-brand`,
      activeIngredientId: ingredients[0].id,
      remarks: "Initial remarks",
    });
  }

  async function cleanUpBrands() {
    const brands = await testBrands();
    if (brands.length === 0) return;
    const brandIds = brands.map(({ id }) => id);
    const stocks = await db
      .select({ id: medicationStock.id })
      .from(medicationStock)
      .where(inArray(medicationStock.medicationBrandId, brandIds));

    // Delete dependent history before stock, then brands before ingredients.
    if (stocks.length > 0) {
      const stockIds = stocks.map(({ id }) => id);
      await db
        .delete(stockChanges)
        .where(inArray(stockChanges.stockId, stockIds));
      await db
        .delete(medicationStock)
        .where(inArray(medicationStock.id, stockIds));
    }
    await db
      .delete(medicationBrands)
      .where(inArray(medicationBrands.id, brandIds));
  }

  beforeAll(async () => {
    const [user] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .limit(1);
    if (!user) {
      throw new Error(
        "Seed a local auth user before running router integration tests.",
      );
    }
    caller = callerFor(user.id);
    await createIngredient("mg");
    await createIngredient("tablets");
  });

  afterEach(cleanUpBrands);

  afterAll(async () => {
    await cleanUpBrands();
    if (ingredients.length > 0) {
      await db.delete(medicationActiveIngredients).where(
        inArray(
          medicationActiveIngredients.id,
          ingredients.map(({ id }) => id),
        ),
      );
    }
  });

  describe("list", () => {
    it("returns the stored brand fields", async () => {
      const brand = await createBrand();
      expect(await caller.medicationBrandRouter.list()).toContainEqual(brand);
    });

    it("returns the joined ingredient name and unit of measurement", async () => {
      const brand = await createBrand();
      expect(
        await caller.medicationBrandRouter.listWithActiveIngredientName(),
      ).toContainEqual({
        ...brand,
        activeIngredientName: ingredients[0].name,
        unitOfMeasurement: ingredients[0].unitOfMeasurement,
      });
    });
  });

  describe("create", () => {
    it("persists the name, selected ingredient ID, and remarks", async () => {
      const brand = await createBrand();
      expect(await testBrands()).toEqual([brand]);
      expect(brand).toMatchObject({
        name: `${prefix}-brand`,
        activeIngredientId: ingredients[0].id,
        remarks: "Initial remarks",
      });
    });

    it("allows omitted remarks", async () => {
      const brand = await caller.medicationBrandRouter.create({
        name: `${prefix}-without-remarks`,
        activeIngredientId: ingredients[0].id,
      });
      expect(brand.remarks).toBeNull();
      expect(await testBrands()).toEqual([brand]);
    });

    it("rejects an empty name without creating a brand", async () => {
      await expect(
        caller.medicationBrandRouter.create({
          name: "",
          activeIngredientId: ingredients[0].id,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(await testBrands()).toHaveLength(0);
    });

    it("rejects a nonexistent ingredient ID", async () => {
      const removed = await createIngredient("removed");
      await db
        .delete(medicationActiveIngredients)
        .where(eq(medicationActiveIngredients.id, removed.id));

      await expect(
        caller.medicationBrandRouter.create({
          name: `${prefix}-invalid-ingredient`,
          activeIngredientId: removed.id,
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { cause: { code: "23503" } },
      });
      expect(await testBrands()).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("persists changes and returns the new ingredient details in the joined list", async () => {
      const brand = await createBrand();
      const updated = await caller.medicationBrandRouter.update({
        id: brand.id,
        name: `${prefix}-updated`,
        activeIngredientId: ingredients[1].id,
        remarks: "Updated remarks",
      });
      expect(updated).toEqual({
        ...brand,
        name: `${prefix}-updated`,
        activeIngredientId: ingredients[1].id,
        remarks: "Updated remarks",
      });
      expect(await testBrands()).toEqual([updated]);
      expect(
        await caller.medicationBrandRouter.listWithActiveIngredientName(),
      ).toContainEqual({
        ...updated,
        activeIngredientName: ingredients[1].name,
        unitOfMeasurement: ingredients[1].unitOfMeasurement,
      });
    });

    it("rejects an empty name and leaves the brand unchanged", async () => {
      const brand = await createBrand();
      await expect(
        caller.medicationBrandRouter.update({
          id: brand.id,
          name: "",
          activeIngredientId: ingredients[0].id,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(await testBrands()).toEqual([brand]);
    });

    it("rejects a nonexistent ingredient ID and leaves all fields unchanged", async () => {
      const brand = await createBrand();
      const removed = await createIngredient("removed-update");
      await db
        .delete(medicationActiveIngredients)
        .where(eq(medicationActiveIngredients.id, removed.id));

      await expect(
        caller.medicationBrandRouter.update({
          id: brand.id,
          name: `${prefix}-invalid-update`,
          activeIngredientId: removed.id,
          remarks: "Should not persist",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { cause: { code: "23503" } },
      });
      expect(await testBrands()).toEqual([brand]);
    });
  });

  describe("delete", () => {
    it("deletes a brand without dependent stock", async () => {
      const brand = await createBrand();
      await expect(
        caller.medicationBrandRouter.delete({ id: brand.id }),
      ).resolves.toEqual({ success: true });
      expect(await testBrands()).toHaveLength(0);
    });

    it("returns false when deleting a brand that was already deleted", async () => {
      const brand = await createBrand();
      await caller.medicationBrandRouter.delete({ id: brand.id });
      await expect(
        caller.medicationBrandRouter.delete({ id: brand.id }),
      ).resolves.toEqual({ success: false });
    });

    it("restricts brand deletion when stock depends on it", async () => {
      const brand = await createBrand();
      const stock = await caller.medicationStockRouter.create({
        medicationBrandId: brand.id,
        quantity: 10,
        expiry: new Date("2099-12-31"),
        location: "Brand integration test shelf",
        stockStatus: "active",
      });

      await expect(
        caller.medicationBrandRouter.delete({ id: brand.id }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { cause: { code: "23503" } },
      });
      expect(await testBrands()).toEqual([brand]);
      expect(
        await db
          .select()
          .from(medicationStock)
          .where(eq(medicationStock.id, stock.id)),
      ).toEqual([stock]);
    });

    it("restricts ingredient deletion when a brand depends on it", async () => {
      const brand = await createBrand();
      await expect(
        caller.medicationActiveIngredientsRouter.delete({
          id: ingredients[0].id,
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { cause: { code: "23503" } },
      });
      expect(await testBrands()).toEqual([brand]);
      expect(
        await db
          .select()
          .from(medicationActiveIngredients)
          .where(eq(medicationActiveIngredients.id, ingredients[0].id)),
      ).toEqual([ingredients[0]]);
    });
  });
});
