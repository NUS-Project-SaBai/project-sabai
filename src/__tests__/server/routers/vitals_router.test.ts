// @vitest-environment node
// Integration tests against the local Postgres in .env (`supabase start`).
// Node env because envVariables.ts only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import type { Context } from "@/server/context";
import { vitals, visits, patients, villageCodes } from "@/db/schema";

const SEED_PATIENT = {
  name: "Vitals Test Patient",
  gender: "male",
  drugAllergy: "NKDA",
  dateOfBirth: new Date("1985-06-15"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "test/placeholder",
} as const;

const VILLAGE_CODE = {
  code: "VTLTEST",
  name: "Vitals Test Village",
  colorHex: "#2980B9",
};

// What the vitals form sends for blank number inputs.
const BLANK_NUMBERS = {
  height: null,
  weight: null,
  temperature: null,
  systolic: null,
  diastolic: null,
  heartRate: null,
  hemocueCount: null,
  bloodGlucoseNonFasting: null,
  bloodGlucoseFasting: null,
  hba1c: null,
};

// protectedProcedure only checks ctx.user, so a placeholder id is enough.
const caller = appRouter.createCaller({
  user: { id: "vitals-router-test-user" },
} as unknown as Context);

describe("vitalsRouter (integration)", () => {
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

  // visitId is unique on vitals, so each test needs a fresh slate.
  afterEach(async () => {
    await db.delete(vitals).where(eq(vitals.visitId, visitId));
  });

  afterAll(async () => {
    await db.delete(vitals).where(eq(vitals.visitId, visitId));
    await db.delete(visits).where(eq(visits.id, visitId));
    await db.delete(patients).where(eq(patients.id, patientId));
    await db.delete(villageCodes).where(eq(villageCodes.id, villageCodeId));
  });

  describe("create()", () => {
    it("persists null number fields as NULL, not 0", async () => {
      await caller.vitalsRouter.create({
        ...BLANK_NUMBERS,
        visitId,
        weight: "70.5",
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({ ...BLANK_NUMBERS, weight: "70.50" });
    });

    it("persists blank-string number fields as NULL, not 0", async () => {
      await caller.vitalsRouter.create({
        visitId,
        height: "",
        weight: "  ",
        systolic: "",
        hba1c: "",
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        height: null,
        weight: null,
        systolic: null,
        hba1c: null,
      });
    });

    it("keeps an explicit 0 as 0", async () => {
      await caller.vitalsRouter.create({
        visitId,
        hba1c: 0,
        heartRate: 0,
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({ hba1c: "0.00", heartRate: 0 });
    });

    it("accepts numeric strings and numbers at the allowed precision", async () => {
      await caller.vitalsRouter.create({
        visitId,
        height: "170.5",
        weight: 70.25,
        systolic: 120,
        diastolic: 80,
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        height: "170.50",
        weight: "70.25",
        systolic: 120,
        diastolic: 80,
      });
    });

    it("rejects non-numeric strings", async () => {
      await expect(
        caller.vitalsRouter.create({
          visitId,
          height: "abc",
        }),
      ).rejects.toThrow("Height must be a number");
    });

    it("rejects values finer than the column step", async () => {
      await expect(
        caller.vitalsRouter.create({
          visitId,
          temperature: "36.55",
        }),
      ).rejects.toThrow("Body temperature must be in steps of 0.1");
    });

    it("rejects non-integers for integer columns", async () => {
      await expect(
        caller.vitalsRouter.create({
          visitId,
          heartRate: 72.5,
        }),
      ).rejects.toThrow("Heart rate must be a whole number");
    });
  });

  describe("updateByVisitId()", () => {
    const SAVED = {
      height: "170.5",
      weight: "70.5",
      systolic: 120,
      heartRate: 72,
      hba1c: "5.5",
      urineTest: "Trace protein",
      others: "Patient anxious",
    };

    it("clears saved fields to NULL when sent null", async () => {
      await caller.vitalsRouter.create({ visitId, ...SAVED });

      await caller.vitalsRouter.updateByVisitId({
        visitId,
        height: null,
        systolic: null,
        hba1c: null,
        urineTest: null,
        others: null,
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        height: null,
        systolic: null,
        hba1c: null,
        urineTest: null,
        others: null,
      });
    });

    it("clears saved fields to NULL when sent blank strings", async () => {
      await caller.vitalsRouter.create({ visitId, ...SAVED });

      await caller.vitalsRouter.updateByVisitId({
        visitId,
        weight: "",
        heartRate: "",
      });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({ weight: null, heartRate: null });
    });

    it("leaves omitted fields untouched", async () => {
      await caller.vitalsRouter.create({ visitId, ...SAVED });

      await caller.vitalsRouter.updateByVisitId({ visitId, height: null });

      const row = await caller.vitalsRouter.getByVisitId({ visitId });
      expect(row).toMatchObject({
        height: null,
        weight: "70.50",
        systolic: 120,
        heartRate: 72,
        hba1c: "5.50",
        urineTest: SAVED.urineTest,
        others: SAVED.others,
      });
    });
  });
});
