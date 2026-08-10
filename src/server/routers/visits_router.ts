import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { visits, patients, villageCodes } from "@/db/schema/schema";
import { eq, desc } from "drizzle-orm";

export const visitsRouter = router({
  // List all visits with patient and village code details
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: visits.id,
        date: visits.date,
        patientId: visits.patientId,
        villageCodeId: visits.villageCodeId,
        patientName: patients.name,
        villageCodeName: villageCodes.name,
        villageCodeColor: villageCodes.colorHex,
      })
      .from(visits)
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .innerJoin(villageCodes, eq(visits.villageCodeId, villageCodes.id))
      .orderBy(desc(visits.date));

    return result;
  }),

  // Get single visit by ID with patient and village code details
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({
          id: visits.id,
          date: visits.date,
          patientId: visits.patientId,
          villageCodeId: visits.villageCodeId,
          patientName: patients.name,
          villageCodeName: villageCodes.name,
          villageCodeColor: villageCodes.colorHex,
        })
        .from(visits)
        .innerJoin(patients, eq(visits.patientId, patients.id))
        .innerJoin(villageCodes, eq(visits.villageCodeId, villageCodes.id))
        .where(eq(visits.id, input.id))
        .limit(1);

      return result || null;
    }),

  // Get visits by patient ID
  getByPatientId: protectedProcedure
    .input(z.object({ patientId: z.number().int() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          id: visits.id,
          date: visits.date,
          patientId: visits.patientId,
          villageCodeId: visits.villageCodeId,
          villageCodeName: villageCodes.name,
          villageCodeColor: villageCodes.colorHex,
        })
        .from(visits)
        .innerJoin(villageCodes, eq(visits.villageCodeId, villageCodes.id))
        .where(eq(visits.patientId, input.patientId))
        .orderBy(desc(visits.date));

      return result;
    }),

  // Create new visit
  create: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int(),
        villageCodeId: z.number().int(),
        date: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newVisit] = await db.insert(visits).values(input).returning();

      return newVisit;
    }),

  // Update visit
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        patientId: z.number().int().optional(),
        villageCodeId: z.number().int().optional(),
        date: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(visits)
        .set(updateData)
        .where(eq(visits.id, id))
        .returning();

      return result || null;
    }),

  // Delete visit
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [result] = await db
        .delete(visits)
        .where(eq(visits.id, input.id))
        .returning({ id: visits.id });

      return { success: !!result };
    }),
});
