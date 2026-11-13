import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import {
  referrals,
  consults,
  visits,
  patients,
  villageCodes,
  referralStateEnum,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getPatientWithImageUrl } from "@/server/utils/cloudinary";

const referralStateSchema = z.enum(referralStateEnum.enumValues);

// Referral joined to its consult, visit, patient, and the village code of the
// visit the referral was made at (not the patient's latest visit).
const enrichedReferralQuery = () =>
  db
    .select({
      id: referrals.id,
      referredFor: referrals.referredFor,
      referralNotes: referrals.referralNotes,
      referralState: referrals.referralState,
      referralOutcome: referrals.referralOutcome,
      consultId: referrals.consultId,
      createdAt: referrals.createdAt,
      consultDate: consults.date,
      doctorId: consults.doctorId,
      patientId: patients.id,
      patientName: patients.name,
      patientImagePublicId: patients.patientImagePublicId,
      villageCodeId: visits.villageCodeId,
      villageCode: villageCodes.code,
      villageColorHex: villageCodes.colorHex,
    })
    .from(referrals)
    .innerJoin(consults, eq(referrals.consultId, consults.id))
    .innerJoin(visits, eq(consults.visitId, visits.id))
    .innerJoin(patients, eq(visits.patientId, patients.id))
    .innerJoin(villageCodes, eq(visits.villageCodeId, villageCodes.id))
    .$dynamic();

export const referralRouter = router({
  // List all referrals enriched with patient, village, and consult details, newest first
  list: protectedProcedure.query(async () => {
    // id breaks ties between referrals created at the same timestamp.
    const result = await enrichedReferralQuery().orderBy(
      desc(referrals.createdAt),
      desc(referrals.id),
    );

    return result.map(getPatientWithImageUrl);
  }),

  // Get a single referral by ID with full enrichment
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [result] = await enrichedReferralQuery()
        .where(eq(referrals.id, input.id))
        .limit(1);

      return result ? getPatientWithImageUrl(result) : null;
    }),

  // Get all referrals for a consult
  getByConsultId: protectedProcedure
    .input(z.object({ consultId: z.number().int() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(referrals)
        .where(eq(referrals.consultId, input.consultId))
        .orderBy(desc(referrals.createdAt));

      return result;
    }),

  // Create a referral — called by the Frontend after POST /consults/
  create: protectedProcedure
    .input(
      z.object({
        consultId: z.number().int(),
        referredFor: z.string().min(1),
        referralNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newReferral] = await db
        .insert(referrals)
        .values({
          consultId: input.consultId,
          referredFor: input.referredFor,
          referralNotes: input.referralNotes ?? null,
          referralState: "New",
        })
        .returning();

      return newReferral;
    }),

  // Update referral state and outcome
  updateState: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        referralState: referralStateSchema,
        referralOutcome: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(referrals)
        .set(updateData)
        .where(eq(referrals.id, id))
        .returning();

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral not found",
        });
      }
      return result;
    }),

  // Update only the outcome, so saving it can never overwrite a status that
  // changed since the caller loaded the referral
  updateOutcome: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        referralOutcome: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [result] = await db
        .update(referrals)
        .set({ referralOutcome: input.referralOutcome })
        .where(eq(referrals.id, input.id))
        .returning();

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral not found",
        });
      }
      return result;
    }),
});
