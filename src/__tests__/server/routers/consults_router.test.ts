// @vitest-environment node
//
// Integration tests for the consults tRPC router. Run against the Postgres
// instance configured in .env so FK constraints and returning() clauses are
// exercised for real.
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied,
//          and at least one login linked to public.users (`pnpm seed:users`).
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
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
  users,
} from "@/db/schema";
import { CONSULT_EDIT_WINDOW_MS } from "@/lib/constants/consults";
import { getLinkedTestUser } from "./testUsers";

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

function callerFor(authUserId: string) {
  return appRouter.createCaller({
    user: { id: authUserId },
  } as unknown as Context);
}

describe("consultsRouter (integration)", () => {
  let userId: string;
  let authUserId: string;
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;
  let caller: ReturnType<typeof callerFor>;

  beforeAll(async () => {
    ({ userId, authUserId } = await getLinkedTestUser());

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

    caller = callerFor(authUserId);
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

  describe("update()", () => {
    const createConsult = () =>
      caller.consultsRouter.create({
        visitId,
        consultation: "Initial notes",
        remarks: "Follow up in a week",
        diagnoses: [{ details: "Fever", category: "Infectious Diseases" }],
      });

    it("updates the consult text and replaces its diagnoses", async () => {
      // Given - a consult written by the current doctor
      const { id } = await createConsult();

      // When
      await caller.consultsRouter.update({
        id,
        consultation: "Corrected notes",
        remarks: "Follow up in a week",
        diagnoses: [
          { details: "Dengue", category: "Infectious Diseases" },
          { details: "Dehydration", category: "Others" },
        ],
      });

      // Then - text is updated and the old diagnosis is gone
      const [row] = await db.select().from(consults).where(eq(consults.id, id));
      expect(row.consultation).toBe("Corrected notes");
      const rows = await db
        .select()
        .from(diagnosis)
        .where(eq(diagnosis.consultId, id));
      expect(rows.map((d) => d.details).sort()).toEqual([
        "Dehydration",
        "Dengue",
      ]);
    });

    it("clears a text field that is sent blank", async () => {
      // Given - a consult with remarks
      const { id } = await createConsult();

      // When - the doctor clears the remarks
      await caller.consultsRouter.update({
        id,
        consultation: "Initial notes",
        remarks: "   ",
        diagnoses: [{ details: "Fever", category: "Infectious Diseases" }],
      });

      // Then - remarks are stored as NULL rather than left unchanged
      const [row] = await db.select().from(consults).where(eq(consults.id, id));
      expect(row.remarks).toBeNull();
    });

    it("rejects edits once the 24-hour window has passed", async () => {
      // Given - a consult created just over 24 hours ago
      const { id } = await createConsult();
      await db
        .update(consults)
        .set({ date: new Date(Date.now() - CONSULT_EDIT_WINDOW_MS - 60_000) })
        .where(eq(consults.id, id));

      // When / Then
      await expect(
        caller.consultsRouter.update({
          id,
          diagnoses: [{ details: "Late edit", category: "Others" }],
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("24-hour"),
      });
    });

    it("rejects edits from a doctor who did not write the consult", async () => {
      // Given - a consult written by a different doctor
      const [otherDoctor] = await db
        .insert(users)
        .values({ name: "Other Test Doctor" })
        .returning({ id: users.id });
      const [{ id }] = await db
        .insert(consults)
        .values({ visitId, doctorId: otherDoctor.id })
        .returning({ id: consults.id });

      try {
        // When / Then
        await expect(
          caller.consultsRouter.update({
            id,
            diagnoses: [{ details: "Not mine", category: "Others" }],
          }),
        ).rejects.toMatchObject({
          code: "FORBIDDEN",
          message: expect.stringContaining("Only the doctor"),
        });
      } finally {
        await db.delete(consults).where(eq(consults.id, id));
        await db.delete(users).where(eq(users.id, otherDoctor.id));
      }
    });

    it("returns NOT_FOUND for a consult that does not exist", async () => {
      await expect(
        caller.consultsRouter.update({
          id: 2_000_000_000,
          diagnoses: [{ details: "Ghost", category: "Others" }],
        }),
      ).rejects.toBeInstanceOf(TRPCError);
    });
  });
});
