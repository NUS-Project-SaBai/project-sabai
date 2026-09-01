// @vitest-environment node
//
// Integration tests for the referral tRPC router. These run against the
// Postgres instance configured in .env so the joins, enum handling, and FK
// constraints are exercised for real
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied, and at least one auth.users row (`pnpm seed:users`).
//
// Runs in the node environment (not jsdom) because src/lib/envVariables.ts
// switches on `typeof window` and only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import type { Context } from "@/server/context";
import {
  referrals,
  consults,
  visits,
  patients,
  villageCodes,
  authUsers,
} from "@/db/schema";

// Fixture inserted into Postgres for the FK chain (not mocks).
const SEED_PATIENT = {
  name: "Referral Test Patient",
  gender: "female",
  drugAllergy: "NKDA", // NKDA stands for "No Known Drug Allergies"
  dateOfBirth: new Date("1990-01-01"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "test/placeholder",
} as const;

const VILLAGE_CODE = {
  code: "SATBB",
  name: "SATBB Village",
  colorHex: "#C0392B",
};

// protectedProcedure only reads ctx.user, so a minimal context is enough.
function callerFor(userId: string) {
  return appRouter.createCaller({ user: { id: userId } } as unknown as Context);
}

describe("referralRouter (integration)", () => {
  let userId: string;
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;
  let consultId: number;
  let caller: ReturnType<typeof callerFor>;

  beforeAll(async () => {
    // A consult FK-references auth.users; reuse an existing seeded user.
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

    [{ id: villageCodeId }] = await db
      .insert(villageCodes)
      .values({
        code: VILLAGE_CODE.code,
        name: VILLAGE_CODE.name,
        colorHex: VILLAGE_CODE.colorHex,
      })
      .returning({ id: villageCodes.id });

    [{ id: patientId }] = await db
      .insert(patients)
      .values(SEED_PATIENT)
      .returning({ id: patients.id });

    [{ id: visitId }] = await db
      .insert(visits)
      .values({ patientId, villageCodeId })
      .returning({ id: visits.id });

    [{ id: consultId }] = await db
      .insert(consults)
      .values({ doctorId: userId, visitId })
      .returning({ id: consults.id });

    caller = callerFor(userId);
  });

  // Each test creates its own referrals; wipe them so counts stay deterministic.
  afterEach(async () => {
    await db.delete(referrals).where(eq(referrals.consultId, consultId));
  });

  // Tear down the seed chain in FK-dependency order.
  afterAll(async () => {
    await db.delete(referrals).where(eq(referrals.consultId, consultId));
    await db.delete(consults).where(eq(consults.id, consultId));
    await db.delete(visits).where(eq(visits.id, visitId));
    await db.delete(patients).where(eq(patients.id, patientId));
    await db.delete(villageCodes).where(eq(villageCodes.id, villageCodeId));
  });

  describe("create()", () => {
    // Calls create with only consultId and referredFor (no notes)
    it("defaults state to New and notes to null when omitted", async () => {
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Cardiology",
      });
      expect(created.referralState).toBe("New");
      expect(created.referralNotes).toBeNull();
      expect(created.consultId).toBe(consultId);
    });
  });

  describe("list()", () => {
    // Confirm that the joins actually resolve and returns the enriched fields (patientName, doctorId, etc.) rather than just the raw referrals table.
    it("enriches referrals via the patient/consult joins", async () => {
      await caller.referralRouter.create({
        consultId,
        referredFor: "Dermatology",
        referralNotes: "urgent",
      });
      const rows = await caller.referralRouter.list();
      const row = rows.find((r) => r.consultId === consultId);
      expect(row).toBeDefined();
      expect(row!.patientId).toBe(patientId);
      expect(row!.patientName).toBe(SEED_PATIENT.name);
      expect(row!.doctorId).toBe(userId);
      expect(row!.referralNotes).toBe("urgent");
    });
  });

  describe("getById()", () => {
    it("returns the enriched referral, or null when missing", async () => {
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      const found = await caller.referralRouter.getById({ id: created.id });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.patientName).toBe(SEED_PATIENT.name);

      expect(await caller.referralRouter.getById({ id: -1 })).toBeNull();
    });
  });

  describe("getByConsultId()", () => {
    // Create 2 referrals for same consult, then query by consutlId, verify that it returns both and that the consultId matches.
    it("returns every referral for the consult", async () => {
      await caller.referralRouter.create({ consultId, referredFor: "A" });
      await caller.referralRouter.create({ consultId, referredFor: "B" });
      const rows = await caller.referralRouter.getByConsultId({ consultId });
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.consultId === consultId)).toBe(true);
    });
  });

  describe("updateState()", () => {
    it("updates state and outcome", async () => {
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Neurological Disorders",
      });
      const updated = await caller.referralRouter.updateState({
        id: created.id,
        referralState: "CompletedSuccess",
        referralOutcome: "Patient seen and treated",
      });
      expect(updated).not.toBeNull();
      expect(updated!.referralState).toBe("CompletedSuccess");
      expect(updated!.referralOutcome).toBe("Patient seen and treated");
    });

    // Confirm that zod rejects an invalid enum value, rather than passing it to the database.
    // This may not happen as they will be selecting from dropdown options, but it's a good safety check.
    it("rejects a state outside the enum", async () => {
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "X",
      });
      await expect(
        caller.referralRouter.updateState({
          id: created.id,
          // @ts-expect-error invalid enum value must be rejected by zod
          referralState: "Bogus value",
        }),
      ).rejects.toThrow();
    });
  });

  describe("delete()", () => {
    it("reports success only when a row was removed", async () => {
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Uveitis (Inflammation of the uvea)",
      });
      expect(await caller.referralRouter.delete({ id: created.id })).toEqual({
        success: true,
      });
      expect(await caller.referralRouter.delete({ id: created.id })).toEqual({
        success: false,
      });
    });
  });
});
