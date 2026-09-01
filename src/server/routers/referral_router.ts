import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import {
  referrals,
  consults,
  visits,
  patients,
  referralStateEnum,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const referralStateSchema = z.enum(referralStateEnum.enumValues);

export const referralRouter = router({
  // List all referrals enriched with patient, doctor, and date
  list: protectedProcedure.query(async () => {
    const result = await db
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
      })
      .from(referrals)
      .innerJoin(consults, eq(referrals.consultId, consults.id))
      .innerJoin(visits, eq(consults.visitId, visits.id))
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .orderBy(desc(referrals.createdAt));

    return result;
  }),

  // Get a single referral by ID with full enrichment
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [result] = await db
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
        })
        .from(referrals)
        .innerJoin(consults, eq(referrals.consultId, consults.id))
        .innerJoin(visits, eq(consults.visitId, visits.id))
        .innerJoin(patients, eq(visits.patientId, patients.id))
        .where(eq(referrals.id, input.id))
        .limit(1);

      return result || null;
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

      return result || null;
    }),
});
