// @vitest-environment node
// Integration tests against the local Postgres in .env (`supabase start`).
// Node env because envVariables.ts only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import type { Context } from "@/server/context";
import { dental, visits, patients, villageCodes } from "@/db/schema";

const SEED_PATIENT = {
  name: "Dental Test Patient",
  gender: "female",
  drugAllergy: "NKDA",
  dateOfBirth: new Date("2012-03-10"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "test/placeholder",
} as const;

const VILLAGE_CODE = {
  code: "DNTTEST",
  name: "Dental Test Village",
  colorHex: "#16A085",
};

// What the dental form sends when no history question is answered.
const BLANK_HISTORY = {
  previousDentalVisit: null,
  previousDentalTreatment: null,
  toothache: null,
  extraction: null,
  dentalTrauma: null,
  currentToothache: null,
  toothSensitivity: null,
  bleedingGums: null,
  brushingFrequency: null,
  fluorideToothpaste: null,
  sugarConsumption: null,
  otherDentalHistory: null,
};

// protectedProcedure only checks ctx.user, so a placeholder id is enough.
const caller = appRouter.createCaller({
  user: { id: "dental-router-test-user" },
} as unknown as Context);

describe("dentalRouter (integration)", () => {
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;

  beforeAll(async () => {
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
  });

  afterEach(async () => {
    await db.delete(dental).where(eq(dental.visitId, visitId));
  });

  afterAll(async () => {
    await db.delete(dental).where(eq(dental.visitId, visitId));
    await db.delete(visits).where(eq(visits.id, visitId));
    await db.delete(patients).where(eq(patients.id, patientId));
    await db.delete(villageCodes).where(eq(villageCodes.id, villageCodeId));
  });

  describe("getByVisitId()", () => {
    it("returns null when the visit has no dental record", async () => {
      expect(await caller.dentalRouter.getByVisitId({ visitId })).toBeNull();
    });

    it("returns the newest record if a visit has duplicates", async () => {
      await caller.dentalRouter.create({ visitId, toothache: false });
      const newer = await caller.dentalRouter.create({
        visitId,
        toothache: true,
      });

      const row = await caller.dentalRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({ id: newer.id, toothache: true });
    });
  });

  describe("create()", () => {
    it("persists answered history fields and leaves unanswered ones NULL", async () => {
      await caller.dentalRouter.create({
        ...BLANK_HISTORY,
        visitId,
        previousDentalVisit: "unknown",
        toothache: true,
        bleedingGums: false,
        brushingFrequency: "3+ times",
        otherDentalHistory: "Braces",
      });

      const row = await caller.dentalRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        ...BLANK_HISTORY,
        visitId,
        previousDentalVisit: "unknown",
        toothache: true,
        bleedingGums: false,
        brushingFrequency: "3+ times",
        otherDentalHistory: "Braces",
      });
    });

    it("rejects values outside the column's enum", async () => {
      await expect(
        caller.dentalRouter.create({
          visitId,
          // @ts-expect-error -- deliberately invalid enum value
          brushingFrequency: "hourly",
        }),
      ).rejects.toThrow();
    });

    it("rejects text longer than the varchar(255) column", async () => {
      await expect(
        caller.dentalRouter.create({
          visitId,
          otherDentalHistory: "x".repeat(256),
        }),
      ).rejects.toThrow();
    });
  });

  describe("update()", () => {
    it("changes provided fields, clears nulls, and leaves omitted fields untouched", async () => {
      const created = await caller.dentalRouter.create({
        visitId,
        toothache: true,
        sugarConsumption: "high",
        otherDentalHistory: "Braces",
      });

      await caller.dentalRouter.update({
        id: created.id,
        toothache: false,
        otherDentalHistory: null,
      });

      const row = await caller.dentalRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        id: created.id,
        toothache: false,
        sugarConsumption: "high",
        otherDentalHistory: null,
      });
    });

    it("throws NOT_FOUND for an unknown id", async () => {
      await expect(
        caller.dentalRouter.update({ id: 2_147_483_647, toothache: true }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
