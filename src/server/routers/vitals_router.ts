import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { vitals } from "@/db/schema";

const createVitalsInput = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  temperature: z.string().optional(),
  systolic: z.number().int().optional(),
  diastolic: z.number().int().optional(),
  heartRate: z.number().int().positive().optional(),
  leftEyeDegree: z.string().optional(),
  rightEyeDegree: z.string().optional(),
  leftEyePinhole: z.string().optional(),
  rightEyePinhole: z.string().optional(),
  leftAstigmatism: z.string().optional(),
  rightAstigmatism: z.string().optional(),
  hemocueCount: z.string().optional(),
  diabetesMellitus: z.boolean().optional(),
  urineTest: z.string().optional(),
  bloodGlucoseNonFasting: z.string().optional(),
  bloodGlucoseFasting: z.string().optional(),
  hba1c: z.string().optional(),
  others: z.string().optional(),
  visitId: z.number().int().positive(),
});

const updateVitalsInput = createVitalsInput.partial().extend({
  id: z.number().int().positive(),
});

export const vitalsRouter = router({
  create: protectedProcedure
    .input(createVitalsInput)
    .mutation(async ({ input }) => {
      const [vital] = await db.insert(vitals).values(input).returning();
      return vital;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vital = await db
        .select({
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
        })
        .from(vitals)
        .where(eq(vitals.id, input.id))
        .limit(1);

      return vital[0] ?? null;
    }),

  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const vital = await db
        .select({
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
        })
        .from(vitals)
        .where(eq(vitals.visitId, input.visitId))
        .limit(1);

      return vital[0] ?? null;
    }),

  update: protectedProcedure
    .input(updateVitalsInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [updatedVital] = await db
        .update(vitals)
        .set(updateData)
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
      const [updatedVital] = await db
        .update(vitals)
        .set(updateData)
        .where(eq(vitals.visitId, visitId))
        .returning();

      return updatedVital;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(vitals).where(eq(vitals.id, input.id));
      return { success: true };
    }),
});
