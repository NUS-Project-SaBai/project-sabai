import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { vitals } from "@/db/schema";

/**
 * Common select fields for vitals queries to ensure consistency
 * and reduce code duplication across different procedures.
 */
const selectVitalsFields = {
  id: vitals.id,
  height: vitals.height,
  weight: vitals.weight,
  temperature: vitals.temperature,
  systolic: vitals.systolic,
  diastolic: vitals.diastolic,
  heartRate: vitals.heartRate,
  hemocueCount: vitals.hemocueCount,
  diabetesMellitus: vitals.diabetesMellitus,
  urineTest: vitals.urineTest,
  bloodGlucoseNonFasting: vitals.bloodGlucoseNonFasting,
  bloodGlucoseFasting: vitals.bloodGlucoseFasting,
  hba1c: vitals.hba1c,
  others: vitals.others,
  visitId: vitals.visitId,
};

/**
 * Input validation schema for creating vitals records.
 * Uses z.coerce.string() for PostgreSQL numeric fields.
 */
const createVitalsInput = z.object({
  // `.nullish()` (not `.optional()`) so the form can send `null` to explicitly
  // clear a field on update; `undefined` is skipped by Drizzle and would leave
  // the previous value untouched.
  height: z.coerce.string().nullish(), // cm
  weight: z.coerce.string().nullish(), // kg
  temperature: z.coerce.string().nullish(), // °C
  systolic: z.number().int().nullish(), // mmHg
  diastolic: z.number().int().nullish(), // mmHg
  heartRate: z.number().int().nullish(), // bpm
  hemocueCount: z.coerce.string().nullish(), // g/dL
  diabetesMellitus: z.boolean().nullish(),
  urineTest: z.string().nullish(),
  bloodGlucoseNonFasting: z.coerce.string().nullish(), // mg/dL or mmol/L
  bloodGlucoseFasting: z.coerce.string().nullish(), // mg/dL or mmol/L
  hba1c: z.coerce.string().nullish(), // %
  others: z.string().nullish(),
  visitId: z.number().int().positive(),
});

/**
 * Input validation schema for updating vitals records.
 */
const updateVitalsInput = createVitalsInput
  .omit({ visitId: true })
  .partial()
  .extend({
    id: z.number().int().positive(),
  });

/**
 * Input validation schema for updating vitals records by visit ID.
 */
const updateVitalsByVisitIdInput = createVitalsInput
  .omit({ visitId: true })
  .partial()
  .extend({
    visitId: z.number().int().positive(),
  });

export const vitalsRouter = router({
  /**
   * Creates a new vitals record for a patient visit.
   */
  create: protectedProcedure
    .input(createVitalsInput)
    .mutation(async ({ input }) => {
      const [vitalsRecord] = await db.insert(vitals).values(input).returning();
      return vitalsRecord;
    }),

  /**
   * Retrieves a vitals record by its ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vitalsRecord = await db
        .select(selectVitalsFields)
        .from(vitals)
        .where(eq(vitals.id, input.id))
        .limit(1);

      return vitalsRecord[0] ?? null;
    }),

  /**
   * Retrieves a vitals record by visit ID.
   * Since each visit can have only one vitals record (unique constraint).
   */
  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vitalsRecord = await db
        .select(selectVitalsFields)
        .from(vitals)
        .where(eq(vitals.visitId, input.visitId))
        .limit(1);

      return vitalsRecord[0] ?? null;
    }),

  /**
   * Updates a vitals record by its ID.
   * Only updates provided fields (partial update).
   */
  update: protectedProcedure
    .input(updateVitalsInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const [updatedVitals] = await db
        .update(vitals)
        .set(updateData)
        .where(eq(vitals.id, id))
        .returning();

      return updatedVitals;
    }),

  /**
   * Updates a vitals record by visit ID.
   * Only updates provided fields (partial update).
   */
  updateByVisitId: protectedProcedure
    .input(updateVitalsByVisitIdInput)
    .mutation(async ({ input }) => {
      const { visitId, ...updateData } = input;

      const [updatedVitals] = await db
        .update(vitals)
        .set(updateData)
        .where(eq(vitals.visitId, visitId))
        .returning();

      return updatedVitals;
    }),

  /**
   * Deletes a vitals record by its ID.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(vitals).where(eq(vitals.id, input.id));
      return { success: true };
    }),
});

// Export types for use in other parts of the application
export type Vital = typeof vitals.$inferSelect;
export type NewVital = typeof vitals.$inferInsert;
export type CreateVitalsInput = z.infer<typeof createVitalsInput>;
export type UpdateVitalsInput = z.infer<typeof updateVitalsInput>;
export type UpdateVitalsByVisitIdInput = z.infer<
  typeof updateVitalsByVisitIdInput
>;
