import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { puberty } from "@/db/schema/vitals";

/**
 * Common select fields for puberty queries to ensure consistency
 * and reduce code duplication across different procedures.
 */
const selectPubertyFields = {
  id: puberty.id,
  pubarche: puberty.pubarche,
  pubarcheAge: puberty.pubarcheAge,
  thelarche: puberty.thelarche,
  thelarcheAge: puberty.thelarcheAge,
  menarche: puberty.menarche,
  menarcheAge: puberty.menarcheAge,
  voiceChange: puberty.voiceChange,
  voiceChangeAge: puberty.voiceChangeAge,
  testicularGrowth: puberty.testicularGrowth,
  testicularGrowthAge: puberty.testicularGrowthAge,
  additionalNotes: puberty.additionalNotes,
  vitalId: puberty.vitalId,
};

const pubertyAgePairs = [
  { flag: "pubarche", age: "pubarcheAge" },
  { flag: "thelarche", age: "thelarcheAge" },
  { flag: "menarche", age: "menarcheAge" },
  { flag: "voiceChange", age: "voiceChangeAge" },
  { flag: "testicularGrowth", age: "testicularGrowthAge" },
] as const;

function validatePubertyAges(
  data: Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  for (const { flag, age } of pubertyAgePairs) {
    if (data[flag] === false && data[age] !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `${age} must not be set when ${flag} is false`,
        path: [age],
      });
    }
  }
}

// Base object used for schema derivation — superRefine is applied per schema below
// because ZodEffects (returned by superRefine) does not support .omit()/.partial().
const pubertyBaseShape = z.object({
  pubarche: z.boolean().optional(),
  pubarcheAge: z.number().int().positive().optional(),
  thelarche: z.boolean().optional(),
  thelarcheAge: z.number().int().positive().optional(),
  menarche: z.boolean().optional(),
  menarcheAge: z.number().int().positive().optional(),
  voiceChange: z.boolean().optional(),
  voiceChangeAge: z.number().int().positive().optional(),
  testicularGrowth: z.boolean().optional(),
  testicularGrowthAge: z.number().int().positive().optional(),
  additionalNotes: z.string().optional(),
  vitalId: z.number().int().positive(),
});

/**
 * Input validation schema for creating puberty records.
 */
const createPubertyInput = pubertyBaseShape.superRefine(validatePubertyAges);

/**
 * Input validation schema for updating puberty records.
 */
const updatePubertyInput = pubertyBaseShape
  .omit({ vitalId: true })
  .partial()
  .extend({
    id: z.number().int().positive(),
  })
  .superRefine(validatePubertyAges);

/**
 * Input validation schema for updating puberty records by vitalsId.
 */
const updatePubertyInputByVitalsId = pubertyBaseShape
  .omit({ vitalId: true }) // We want it to always be attached to the same vital object
  .partial()
  .extend({
    vitalId: z.number().int().positive(),
  })
  .superRefine(validatePubertyAges);

export const pubertyRouter = router({
  /**
   * Creates a new puberty record for a vitals record.
   */
  create: protectedProcedure
    .input(createPubertyInput)
    .mutation(async ({ input }) => {
      const [pubertyRecord] = await db
        .insert(puberty)
        .values(input)
        .returning(selectPubertyFields);
      return pubertyRecord;
    }),

  /**
   * Retrieves a puberty record by its primary ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const pubertyRecord = await db
        .select(selectPubertyFields)
        .from(puberty)
        .where(eq(puberty.id, input.id))
        .limit(1);

      return pubertyRecord[0] ?? null;
    }),

  /**
   * Retrieves a puberty record by its vital ID.
   */
  getByVitalId: protectedProcedure
    .input(z.object({ vitalId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const pubertyRecord = await db
        .select(selectPubertyFields)
        .from(puberty)
        .where(eq(puberty.vitalId, input.vitalId))
        .limit(1);

      return pubertyRecord[0] ?? null;
    }),

  /**
   * Updates a puberty record by its primary ID.
   * Only updates provided fields (partial update).
   */
  update: protectedProcedure
    .input(updatePubertyInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const [updatedPuberty] = await db
        .update(puberty)
        .set(updateData)
        .where(eq(puberty.id, id))
        .returning();

      return updatedPuberty ?? null;
    }),

  /**
   * Updates a puberty record by vital ID.
   * Only updates provided fields (partial update).
   */
  updateByVitalId: protectedProcedure
    .input(updatePubertyInputByVitalsId)
    .mutation(async ({ input }) => {
      const { vitalId, ...updateData } = input;

      const [updatedPuberty] = await db
        .update(puberty)
        .set(updateData)
        .where(eq(puberty.vitalId, vitalId))
        .returning();

      return updatedPuberty ?? null;
    }),

  /**
   * Deletes a puberty record by its primary ID.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(puberty).where(eq(puberty.id, input.id));
      return { success: true };
    }),
});

// Export types for use in other parts of the application
export type CreatePubertyInput = z.infer<typeof createPubertyInput>;
export type UpdatePubertyInput = z.infer<typeof updatePubertyInput>;
export type UpdatePubertyInputByVitalsId = z.infer<
  typeof updatePubertyInputByVitalsId
>;
