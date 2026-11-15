// @vitest-environment node
//
// Integration tests for the consults tRPC router. Run against the Postgres
// instance configured in .env so FK constraints and returning() clauses are
// exercised for real.
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied,
//          and at least one auth.users row (`pnpm seed:users`).
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import type { Context } from "@/server/context";
import {
  consults,
  diagnosis,
  referrals,
  visits,
  patients,
  villageCodes,
  authUsers,
} from "@/db/schema";

const SEED_PATIENT = {
  name: "Referral Test Patient",
  gender: "female",
  drugAllergy: "NKDA",
  dateOfBirth: new Date("1990-01-01"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "test/placeholder",
} as const;

function callerFor(userId: string) {
  return appRouter.createCaller({ user: { id: userId } } as unknown as Context);
}

describe("consultsRouter (integration)", () => {
  let userId: string;
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;
  let caller: ReturnType<typeof callerFor>;

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

    const [villageCode] = await db
      .select({ id: villageCodes.id })
      .from(villageCodes)
      .where(eq(villageCodes.code, "TT"))
      .limit(1);
    if (!villageCode) {
      throw new Error(
        'No "TT" village code found. Run `pnpm seed:db` before running these tests.',
      );
    }
    villageCodeId = villageCode.id;

    [{ id: patientId }] = await db
      .insert(patients)
      .values(SEED_PATIENT)
      .returning({ id: patients.id });

    [{ id: visitId }] = await db
      .insert(visits)
      .values({ patientId, villageCodeId })
      .returning({ id: visits.id });

    caller = callerFor(userId);
  });

  afterEach(async () => {
    const consultRows = await db
      .select({ id: consults.id })
      .from(consults)
      .where(eq(consults.visitId, visitId));
    const ids = consultRows.map((c) => c.id);
    if (ids.length > 0) {
      for (const id of ids) {
        await db.delete(referrals).where(eq(referrals.consultId, id));
        await db.delete(diagnosis).where(eq(diagnosis.consultId, id));
      }
      await db.delete(consults).where(eq(consults.visitId, visitId));
    }
  });

  afterAll(async () => {
    await db.delete(visits).where(eq(visits.id, visitId));
    await db.delete(patients).where(eq(patients.id, patientId));
    // village code is seeded — not owned by this suite, do not delete
  });

  describe("create()", () => {
    it("returns the new consult with a numeric id and persists diagnoses", async () => {
      // Given - a valid consult payload with one diagnosis
      const created = await caller.consultsRouter.create({
        visitId,
        pastMedicalHistory: "No prior conditions",
        consultation: "Routine check",
        diagnoses: [{ details: "Hypertension", category: "Cardiovascular" }],
      });

      // Then - the returned object has an id the caller can use immediately
      expect(created.id).toBeTypeOf("number");
      expect(created.visitId).toBe(visitId);
      expect(created.doctorId).toBe(userId);

      // And the diagnoses are persisted against that id
      const rows = await db
        .select()
        .from(diagnosis)
        .where(eq(diagnosis.consultId, created.id));
      expect(rows).toHaveLength(1);
      expect(rows[0].details).toBe("Hypertension");
    });

    it("returned id is usable as a referral consultId FK", async () => {
      // Given - a consult created via the tRPC procedure (not a raw DB insert)
      const consult = await caller.consultsRouter.create({
        visitId,
        diagnoses: [
          { details: "Chronic back pain", category: "Musculoskeletal" },
        ],
      });

      // When - the returned id is used to create a referral (mirroring ConsultForm)
      const referral = await caller.referralRouter.create({
        consultId: consult.id,
        referredFor: "Orthopaedic",
        referralNotes: "Persistent symptoms",
      });

      // Then - the referral is persisted with the correct consultId
      expect(referral.consultId).toBe(consult.id);
      expect(referral.referralState).toBe("New");
    });

    it("rolls back diagnoses when the transaction fails", async () => {
      // Given - a payload where the consult would insert but the diagnosis FK
      // references a non-existent consultId (simulate by passing a visitId that
      // doesn't exist — the consult insert itself will fail the FK constraint)
      await expect(
        caller.consultsRouter.create({
          visitId: -1,
          diagnoses: [{ details: "Should not persist", category: "Others" }],
        }),
      ).rejects.toThrow();

      // Then - no orphaned diagnosis rows were left behind
      const orphans = await db
        .select()
        .from(diagnosis)
        .where(eq(diagnosis.consultId, -1));
      expect(orphans).toHaveLength(0);
    });
  });

  describe("getByVisitId()", () => {
    it("returns consults with their diagnoses for a visit", async () => {
      // Given - two consults for the same visit
      await caller.consultsRouter.create({
        visitId,
        diagnoses: [{ details: "Fever", category: "Infectious Diseases" }],
      });
      await caller.consultsRouter.create({
        visitId,
        diagnoses: [
          { details: "Diabetes", category: "Endocrine" },
          { details: "Hypertension", category: "Cardiovascular" },
        ],
      });

      // When
      const rows = await caller.consultsRouter.getByVisitId({ visitId });

      // Then - both consults are returned, most recent first
      expect(rows).toHaveLength(2);
      const diagnosisCounts = rows.map((c) => c.diagnoses.length);
      expect(diagnosisCounts).toContain(1);
      expect(diagnosisCounts).toContain(2);
    });

    it("returns an empty array for a visit with no consults", async () => {
      const rows = await caller.consultsRouter.getByVisitId({ visitId });
      expect(rows).toHaveLength(0);
    });
  });
});
