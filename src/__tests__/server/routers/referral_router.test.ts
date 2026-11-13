// @vitest-environment node
//
// Integration tests for the referral tRPC router. These run against the
// Postgres instance configured in .env so the joins, enum handling, and FK
// constraints are exercised for real
// Prereqs: `supabase start` (or `pnpm seed:db`) so migrations are applied, and at least one login linked to public.users (`pnpm seed:users`).
//
// Runs in the node environment (not jsdom) because src/lib/envVariables.ts
// switches on `typeof window` and only exposes DATABASE_URL server-side.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "@/server/routers/_app";
import { db } from "@/db/drizzle";
import serverEnv from "@/lib/envVariables";
import type { Context } from "@/server/context";
import {
  referrals,
  consults,
  visits,
  patients,
  villageCodes,
  referralPartners,
} from "@/db/schema";
import { getLinkedTestUser } from "./testUsers";

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

// A second village the seed patient is seen at after the referral visit.
const LATER_VILLAGE_CODE = {
  code: "SATBL",
  name: "SATBL Village",
  colorHex: "#2E86C1",
};

const EXPECTED_IMAGE_URL = `${serverEnv.CLOUDINARY_URL_PREFIX}/${SEED_PATIENT.patientImagePublicId}`;

// protectedProcedure only reads ctx.user, so a minimal context is enough.
function callerFor(authUserId: string) {
  return appRouter.createCaller({
    user: { id: authUserId },
  } as unknown as Context);
}

describe("referralRouter (integration)", () => {
  let userId: string;
  let authUserId: string;
  let villageCodeId: number;
  let patientId: number;
  let visitId: number;
  let consultId: number;
  let caller: ReturnType<typeof callerFor>;

  beforeAll(async () => {
    // A consult FK-references public.users; reuse an existing seeded user.
    ({ userId, authUserId } = await getLinkedTestUser());

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

    caller = callerFor(authUserId);
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

    it("includes patient photo and village code", async () => {
      // Given - a referral for the seed patient, seen at the seed village
      await caller.referralRouter.create({ consultId, referredFor: "ENT" });
      // When
      const rows = await caller.referralRouter.list();
      // Then - the row carries the photo URL and the village id, code and colour
      const row = rows.find((r) => r.consultId === consultId);
      expect(row).toBeDefined();
      expect(row!.patientImagePublicId).toBe(SEED_PATIENT.patientImagePublicId);
      expect(row!.patientImageUrl).toBe(EXPECTED_IMAGE_URL);
      expect(row!.villageCodeId).toBe(villageCodeId);
      expect(row!.villageCode).toBe(VILLAGE_CODE.code);
      expect(row!.villageColorHex).toBe(VILLAGE_CODE.colorHex);
    });

    it("returns newest referrals first", async () => {
      // Given - two referrals created one after the other
      const first = await caller.referralRouter.create({
        consultId,
        referredFor: "First",
      });
      const second = await caller.referralRouter.create({
        consultId,
        referredFor: "Second",
      });
      // When
      const rows = await caller.referralRouter.list();
      // Then - the later referral comes first
      const ids = rows
        .filter((r) => r.consultId === consultId)
        .map((r) => r.id);
      expect(ids).toEqual([second.id, first.id]);
    });

    it("uses the village code of the referral's visit, not the latest visit", async () => {
      // Given - a referral, then a later visit for the same patient at another village
      await caller.referralRouter.create({ consultId, referredFor: "ENT" });
      const [{ id: laterVillageCodeId }] = await db
        .insert(villageCodes)
        .values(LATER_VILLAGE_CODE)
        .returning({ id: villageCodes.id });
      const [{ id: laterVisitId }] = await db
        .insert(visits)
        .values({ patientId, villageCodeId: laterVillageCodeId })
        .returning({ id: visits.id });

      try {
        // When
        const rows = await caller.referralRouter.list();
        // Then - the referral keeps the village of the consult's visit
        const row = rows.find((r) => r.consultId === consultId);
        expect(row!.villageCodeId).toBe(villageCodeId);
        expect(row!.villageCode).toBe(VILLAGE_CODE.code);
      } finally {
        await db.delete(visits).where(eq(visits.id, laterVisitId));
        await db
          .delete(villageCodes)
          .where(eq(villageCodes.id, laterVillageCodeId));
      }
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
      expect(found!.patientDateOfBirth).toEqual(SEED_PATIENT.dateOfBirth);
      expect(found!.patientContactNo).toBeNull();
      expect(found!.patientHasPoorCard).toBe(SEED_PATIENT.hasPoorCard);
      expect(found!.patientHasBS2Card).toBe(SEED_PATIENT.hasBS2Card);
      expect(found!.patientHasSabaiCard).toBe(SEED_PATIENT.hasSabaiCard);
      expect(found!.patientImageUrl).toBe(EXPECTED_IMAGE_URL);
      expect(found!.villageCodeId).toBe(villageCodeId);
      expect(found!.villageCode).toBe(VILLAGE_CODE.code);
      expect(found!.villageColorHex).toBe(VILLAGE_CODE.colorHex);

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

    it("rejects a referral that does not exist", async () => {
      // When - the status of a missing referral is updated
      const update = caller.referralRouter.updateState({
        id: -1,
        referralState: "Seen",
      });
      // Then - it fails with NOT_FOUND instead of silently succeeding
      await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateOutcome()", () => {
    it("updates the outcome without touching the state", async () => {
      // Given - a referral whose state was changed to Completed
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateState({
        id: created.id,
        referralState: "Completed",
      });
      // When - the outcome is saved
      const updated = await caller.referralRouter.updateOutcome({
        id: created.id,
        referralOutcome: "Treated and discharged",
      });
      // Then - the outcome changes and the state stays Completed
      expect(updated.referralOutcome).toBe("Treated and discharged");
      expect(updated.referralState).toBe("Completed");
    });

    it("rejects a referral that does not exist", async () => {
      // When - the outcome of a missing referral is saved
      const update = caller.referralRouter.updateOutcome({
        id: -1,
        referralOutcome: "x",
      });
      // Then - it fails with NOT_FOUND instead of silently succeeding
      await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateBooth()", () => {
    let partnerId: string;

    beforeAll(async () => {
      [{ id: partnerId }] = await db
        .insert(referralPartners)
        .values({ name: "Booth Test Hospital" })
        .returning({ id: referralPartners.id });
    });

    // Referrals are wiped by the outer afterEach first, so the partner is free.
    afterAll(async () => {
      await db
        .delete(referralPartners)
        .where(eq(referralPartners.id, partnerId));
    });

    it("saves the booth fields without touching other sections", async () => {
      // Given - a referral with a status and outcome already set
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateState({
        id: created.id,
        referralState: "Seen",
        referralOutcome: "Waiting on scan",
      });
      // When - the booth section is saved
      const updated = await caller.referralRouter.updateBooth({
        id: created.id,
        referredToId: partnerId,
        memberInChargeId: userId,
        guardiansContacted: "Yes",
        classOfService: "ImagingDiagnostics",
        descriptionOfService: "  X-ray of left arm  ",
        patientSummaryFromScreening: "Fell from a tree",
        remarksAtBooth: "Mother will attend",
      });
      // Then - the booth fields are saved (trimmed) and the rest is unchanged
      expect(updated).toMatchObject({
        referredToId: partnerId,
        memberInChargeId: userId,
        guardiansContacted: "Yes",
        classOfService: "ImagingDiagnostics",
        descriptionOfService: "X-ray of left arm",
        patientSummaryFromScreening: "Fell from a tree",
        remarksAtBooth: "Mother will attend",
        referralState: "Seen",
        referralOutcome: "Waiting on scan",
      });
      // And - getById returns them for the booth form
      const found = await caller.referralRouter.getById({ id: created.id });
      expect(found).toMatchObject({
        referredToId: partnerId,
        memberInChargeId: userId,
        guardiansContacted: "Yes",
        classOfService: "ImagingDiagnostics",
      });
    });

    it("clears fields sent as null or blank text", async () => {
      // Given - a referral with booth details saved
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateBooth({
        id: created.id,
        referredToId: partnerId,
        memberInChargeId: userId,
        guardiansContacted: "No",
        classOfService: "ChronicManagement",
        descriptionOfService: "Diabetes follow-up",
        patientSummaryFromScreening: "High glucose",
        remarksAtBooth: "None",
      });
      // When - it is saved again with everything cleared
      const updated = await caller.referralRouter.updateBooth({
        id: created.id,
        referredToId: null,
        memberInChargeId: null,
        guardiansContacted: null,
        classOfService: null,
        descriptionOfService: "",
        patientSummaryFromScreening: "   ",
        remarksAtBooth: null,
      });
      // Then - every booth field is null
      expect(updated).toMatchObject({
        referredToId: null,
        memberInChargeId: null,
        guardiansContacted: null,
        classOfService: null,
        descriptionOfService: null,
        patientSummaryFromScreening: null,
        remarksAtBooth: null,
      });
    });

    it("rejects a referral that does not exist", async () => {
      // When - the booth section of a missing referral is saved
      const update = caller.referralRouter.updateBooth({
        id: -1,
        referredToId: null,
        memberInChargeId: null,
        guardiansContacted: null,
        classOfService: null,
      });
      // Then - it fails with NOT_FOUND instead of silently succeeding
      await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateParty()", () => {
    it("defaults the party checkboxes to false on a new referral", async () => {
      // When - a referral is created
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      // Then - nothing is ticked yet
      expect(created).toMatchObject({
        presentAtReferralParty: false,
        followUp: false,
        doctorsUpdated: false,
      });
    });

    it("saves the party fields without touching other sections", async () => {
      // Given - a referral with booth details saved
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateBooth({
        id: created.id,
        referredToId: null,
        memberInChargeId: userId,
        guardiansContacted: "Yes",
        classOfService: "DefinitiveTreatment",
        remarksAtBooth: "Booth remark",
      });
      // When - the party section is saved
      const updated = await caller.referralRouter.updateParty({
        id: created.id,
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "  Seen by surgeon  ",
        followUp: true,
        doctorsUpdated: true,
      });
      // Then - the party fields are saved (trimmed) and the booth is unchanged
      expect(updated).toMatchObject({
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "Seen by surgeon",
        followUp: true,
        doctorsUpdated: true,
        memberInChargeId: userId,
        guardiansContacted: "Yes",
        classOfService: "DefinitiveTreatment",
        remarksAtBooth: "Booth remark",
      });
      // And - getById returns them for the party form
      const found = await caller.referralRouter.getById({ id: created.id });
      expect(found).toMatchObject({
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "Seen by surgeon",
        followUp: true,
        doctorsUpdated: true,
      });
    });

    it("clears the member and blank results", async () => {
      // Given - a referral with party details saved
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateParty({
        id: created.id,
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "Seen",
        followUp: true,
        doctorsUpdated: true,
      });
      // When - it is saved again cleared
      const updated = await caller.referralRouter.updateParty({
        id: created.id,
        memberOnRunId: null,
        presentAtReferralParty: false,
        referralPartyResults: "   ",
        followUp: false,
        doctorsUpdated: false,
      });
      // Then - the member and results are null and the checkboxes false
      expect(updated).toMatchObject({
        memberOnRunId: null,
        presentAtReferralParty: false,
        referralPartyResults: null,
        followUp: false,
        doctorsUpdated: false,
      });
    });

    it("rejects a referral that does not exist", async () => {
      // When - the party section of a missing referral is saved
      const update = caller.referralRouter.updateParty({
        id: -1,
        memberOnRunId: null,
        presentAtReferralParty: false,
        followUp: false,
        doctorsUpdated: false,
      });
      // Then - it fails with NOT_FOUND instead of silently succeeding
      await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateMoney()", () => {
    it("saves the amounts exactly without touching other sections", async () => {
      // Given - a referral with party details saved
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateParty({
        id: created.id,
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "Seen",
        followUp: true,
        doctorsUpdated: false,
      });
      // When - the money section is saved
      const updated = await caller.referralRouter.updateMoney({
        id: created.id,
        amountPaidUsd: "0.30",
        amountPaidRiels: 40000,
        memberWhoPaidId: userId,
      });
      // Then - the amounts are stored exactly and the party is unchanged
      expect(updated).toMatchObject({
        amountPaidUsd: "0.30",
        amountPaidRiels: 40000,
        memberWhoPaidId: userId,
        memberOnRunId: userId,
        presentAtReferralParty: true,
        referralPartyResults: "Seen",
        followUp: true,
      });
      // And - getById returns them for the money form
      const found = await caller.referralRouter.getById({ id: created.id });
      expect(found).toMatchObject({
        amountPaidUsd: "0.30",
        amountPaidRiels: 40000,
        memberWhoPaidId: userId,
      });
    });

    it("pads whole USD amounts to 2 decimals", async () => {
      // Given - a referral
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      // When - a whole USD amount is saved
      const updated = await caller.referralRouter.updateMoney({
        id: created.id,
        amountPaidUsd: "15",
        amountPaidRiels: null,
        memberWhoPaidId: null,
      });
      // Then - it comes back from numeric(10, 2) with 2 decimals
      expect(updated.amountPaidUsd).toBe("15.00");
    });

    it("clears every money field sent as null", async () => {
      // Given - a referral with a payment saved
      const created = await caller.referralRouter.create({
        consultId,
        referredFor: "Ortho",
      });
      await caller.referralRouter.updateMoney({
        id: created.id,
        amountPaidUsd: "12.50",
        amountPaidRiels: 40000,
        memberWhoPaidId: userId,
      });
      // When - it is saved again cleared
      const updated = await caller.referralRouter.updateMoney({
        id: created.id,
        amountPaidUsd: null,
        amountPaidRiels: null,
        memberWhoPaidId: null,
      });
      // Then - every money field is null
      expect(updated).toMatchObject({
        amountPaidUsd: null,
        amountPaidRiels: null,
        memberWhoPaidId: null,
      });
    });

    it.each([
      ["a USD amount with 3 decimals", { amountPaidUsd: "12.345" }],
      ["a negative USD amount", { amountPaidUsd: "-5" }],
      [
        "a USD amount too large for numeric(10, 2)",
        { amountPaidUsd: "123456789" },
      ],
      ["a fractional riels amount", { amountPaidRiels: 100.5 }],
      ["a negative riels amount", { amountPaidRiels: -1 }],
    ])("rejects %s", async (_label, invalid) => {
      // When - an invalid amount is saved
      const update = caller.referralRouter.updateMoney({
        id: -1,
        amountPaidUsd: null,
        amountPaidRiels: null,
        memberWhoPaidId: null,
        ...invalid,
      });
      // Then - input validation rejects it before the database
      await expect(update).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a referral that does not exist", async () => {
      // When - the money section of a missing referral is saved
      const update = caller.referralRouter.updateMoney({
        id: -1,
        amountPaidUsd: null,
        amountPaidRiels: null,
        memberWhoPaidId: null,
      });
      // Then - it fails with NOT_FOUND instead of silently succeeding
      await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
