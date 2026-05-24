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
  leftEyeDegree: vitals.leftEyeDegree,
  rightEyeDegree: vitals.rightEyeDegree,
  leftEyePinhole: vitals.leftEyePinhole,
  rightEyePinhole: vitals.rightEyePinhole,
  leftAstigmatism: vitals.leftAstigmatism,
  rightAstigmatism: vitals.rightAstigmatism,
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
 * Uses appropriate numeric types with reasonable medical ranges.
 */
const createVitalsInput = z.object({
  height: z.number().positive().max(300).optional(), // cm, reasonable human height range
  weight: z.number().positive().max(1000).optional(), // kg, reasonable human weight range
  temperature: z.number().min(30).max(45).optional(), // °C, reasonable body temperature range
  systolic: z.number().int().min(60).max(250).optional(), // mmHg, reasonable blood pressure range
  diastolic: z.number().int().min(40).max(150).optional(), // mmHg, reasonable blood pressure range
  heartRate: z.number().int().positive().min(30).max(220).optional(), // bpm, reasonable heart rate range
  leftEyeDegree: z.string().optional(),
  rightEyeDegree: z.string().optional(),
  leftEyePinhole: z.string().optional(),
  rightEyePinhole: z.string().optional(),
  leftAstigmatism: z.string().optional(),
  rightAstigmatism: z.string().optional(),
  hemocueCount: z.number().positive().optional(), // g/dL or similar units
  diabetesMellitus: z.boolean().optional(),
  urineTest: z.string().optional(),
  bloodGlucoseNonFasting: z.number().positive().optional(), // mg/dL or mmol/L
  bloodGlucoseFasting: z.number().positive().optional(), // mg/dL or mmol/L
  hba1c: z.number().positive().max(20).optional(), // %, reasonable HbA1c range
  others: z.string().optional(),
  visitId: z.number().int().positive(),
});

/**
 * Input validation schema for updating vitals records.
 * All fields from create are optional for partial updates.
 */
const updateVitalsInput = createVitalsInput.partial().extend({
  id: z.number().int().positive(),
});

export const vitalsRouter = router({
  /**
   * Creates a new vitals record for a patient visit.
   */
  create: protectedProcedure
    .input(createVitalsInput)
    .mutation(async ({ input }) => {
      // Convert numeric fields to strings for database storage
      const dbInput = {
        ...input,
        height: input.height?.toString(),
        weight: input.weight?.toString(), 
        temperature: input.temperature?.toString(),
        hemocueCount: input.hemocueCount?.toString(),
        bloodGlucoseNonFasting: input.bloodGlucoseNonFasting?.toString(),
        bloodGlucoseFasting: input.bloodGlucoseFasting?.toString(),
        hba1c: input.hba1c?.toString(),
      };
      
      const [vital] = await db.insert(vitals).values(dbInput).returning();
      return vital;
    }),

  /**
   * Retrieves a vitals record by its ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vital = await db
        .select(selectVitalsFields)
        .from(vitals)
        .where(eq(vitals.id, input.id))
        .limit(1);

      return vital[0] ?? null;
    }),

  /**
   * Retrieves a vitals record by visit ID.
   * Since each visit can have only one vitals record (unique constraint).
   */
  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vital = await db
        .select(selectVitalsFields)
        .from(vitals)
        .where(eq(vitals.visitId, input.visitId))
        .limit(1);

      return vital[0] ?? null;
    }),

  /**
   * Updates a vitals record by its ID.
   * Only updates provided fields (partial update).
   */
  update: protectedProcedure
    .input(updateVitalsInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      // Convert numeric fields to strings for database storage
      const dbUpdateData = {
        ...updateData,
        height: updateData.height?.toString(),
        weight: updateData.weight?.toString(),
        temperature: updateData.temperature?.toString(),
        hemocueCount: updateData.hemocueCount?.toString(),
        bloodGlucoseNonFasting: updateData.bloodGlucoseNonFasting?.toString(),
        bloodGlucoseFasting: updateData.bloodGlucoseFasting?.toString(),
        hba1c: updateData.hba1c?.toString(),
      };
      
      const [updatedVital] = await db
        .update(vitals)
        .set(dbUpdateData)
        .where(eq(vitals.id, id))
        .returning();

      return updatedVital;
    }),

  updateByVisitId: protectedProcedure
    .input(
      createVitalsInput.partial().extend({
        visitId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const { visitId, ...updateData } = input;
      
      // Convert numeric fields to strings for database storage
      const dbUpdateData = {
        ...updateData,
        height: updateData.height?.toString(),
        weight: updateData.weight?.toString(),
        temperature: updateData.temperature?.toString(),
        hemocueCount: updateData.hemocueCount?.toString(),
        bloodGlucoseNonFasting: updateData.bloodGlucoseNonFasting?.toString(),
        bloodGlucoseFasting: updateData.bloodGlucoseFasting?.toString(),
        hba1c: updateData.hba1c?.toString(),
      };
      
      const [updatedVital] = await db
        .update(vitals)
        .set(dbUpdateData)
        .where(eq(vitals.visitId, visitId))
        .returning();

      return updatedVital;
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