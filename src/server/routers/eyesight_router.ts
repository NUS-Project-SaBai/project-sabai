import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { eyesight } from "@/db/schema";

/**
 * Common select fields for eyesight queries to ensure consistency
 * and reduce code duplication across different procedures.
 */
const selectEyesightFields = {
  id: eyesight.id,
  visitId: eyesight.visitId,
  leftEyeDegree: eyesight.leftEyeDegree,
  rightEyeDegree: eyesight.rightEyeDegree,
  leftEyePinhole: eyesight.leftEyePinhole,
  rightEyePinhole: eyesight.rightEyePinhole,
  leftAstigmatism: eyesight.leftAstigmatism,
  rightAstigmatism: eyesight.rightAstigmatism,
  comments: eyesight.comments,
};

/**
 * Input validation schema for creating eyesight records.
 */
const createEyesightInput = z.object({
  visitId: z.number().int().positive(),
  leftEyeDegree: z.string().optional(),
  rightEyeDegree: z.string().optional(),
  leftEyePinhole: z.string().optional(),
  rightEyePinhole: z.string().optional(),
  leftAstigmatism: z.string().optional(),
  rightAstigmatism: z.string().optional(),
  comments: z.string().optional(),
});

/**
 * Input validation schema for updating eyesight records.
 * All fields from create are optional for partial updates.
 */
const updateEyesightInput = createEyesightInput.partial().extend({
  id: z.number().int().positive(),
});

export const eyesightRouter = router({
  /**
   * Creates a new eyesight record for a patient visit.
   */
  create: protectedProcedure
    .input(createEyesightInput)
    .mutation(async ({ input }) => {
      const [eyesightRecord] = await db
        .insert(eyesight)
        .values(input)
        .returning();
      return eyesightRecord;
    }),

  /**
   * Retrieves an eyesight record by its ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const eyesightRecord = await db
        .select(selectEyesightFields)
        .from(eyesight)
        .where(eq(eyesight.id, input.id))
        .limit(1);

      return eyesightRecord[0] ?? null;
    }),

  /**
   * Retrieves an eyesight record by visit ID.
   */
  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const eyesightRecord = await db
        .select(selectEyesightFields)
        .from(eyesight)
        .where(eq(eyesight.visitId, input.visitId))
        .limit(1);

      return eyesightRecord[0] ?? null;
    }),

  /**
   * Updates an eyesight record by its ID.
   * Only updates provided fields (partial update).
   */
  update: protectedProcedure
    .input(updateEyesightInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const [updatedEyesight] = await db
        .update(eyesight)
        .set(updateData)
        .where(eq(eyesight.id, id))
        .returning();

      return updatedEyesight;
    }),

  updateByVisitId: protectedProcedure
    .input(
      createEyesightInput.partial().extend({
        visitId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const { visitId, ...updateData } = input;

      const [updatedEyesight] = await db
        .update(eyesight)
        .set(updateData)
        .where(eq(eyesight.visitId, visitId))
        .returning();

      return updatedEyesight;
    }),

  /**
   * Deletes an eyesight record by its ID.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(eyesight).where(eq(eyesight.id, input.id));
      return { success: true };
    }),
});

// Export types for use in other parts of the application
export type Eyesight = typeof eyesight.$inferSelect;
export type NewEyesight = typeof eyesight.$inferInsert;
export type CreateEyesightInput = z.infer<typeof createEyesightInput>;
export type UpdateEyesightInput = z.infer<typeof updateEyesightInput>;
