import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { dental } from "@/db/schema";
import {
  absentPresentNotAssessedValues,
  brushingFrequencyValues,
  cariesValues,
  doneNotDoneValues,
  facialSymmetryValues,
  healthyInflamedBleedingValues,
  malocclusionValues,
  normalLimitedValues,
  oralHygieneValues,
  plaqueValues,
  sugarConsumptionValues,
  yesNoUnknownValues,
} from "@/lib/constants/dental";

/** Every dental field is optional; `null` explicitly clears it on update. */
const enumField = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).nullable().optional();
const booleanField = z.boolean().nullable().optional();
/** Mirrors the `varchar(255)` columns. */
const textField = z.string().max(255).nullable().optional();

const dentalFields = z.object({
  // Dental history
  previousDentalVisit: enumField(yesNoUnknownValues),
  extraction: booleanField,
  previousDentalTreatment: enumField(yesNoUnknownValues),
  toothache: booleanField,
  dentalTrauma: booleanField,
  currentToothache: booleanField,
  toothSensitivity: booleanField,
  bleedingGums: booleanField,
  brushingFrequency: enumField(brushingFrequencyValues),
  fluorideToothpaste: enumField(yesNoUnknownValues),
  sugarConsumption: enumField(sugarConsumptionValues),
  otherDentalHistory: textField,

  // Chief complaint
  chiefComplaint: textField,

  // Clinical examination: extraoral
  facialSymmetry: enumField(facialSymmetryValues),
  facialSwelling: booleanField,
  lymphadenopathy: enumField(absentPresentNotAssessedValues),
  mouthOpening: enumField(normalLimitedValues),

  // Clinical examination: intraoral
  oralHygiene: enumField(oralHygieneValues),
  plaque: enumField(plaqueValues),
  calculus: booleanField,
  gingivalCondition: enumField(healthyInflamedBleedingValues),
  caries: enumField(cariesValues),
  missingTeeth: booleanField,
  fracturedTeeth: booleanField,
  mucosalLesions: booleanField,
  malocclusion: enumField(malocclusionValues),

  // Treatment provided
  fluorideStatus: enumField(doneNotDoneValues),
  fluorideOperator: textField,
  fluorideToothNumber: textField,
  sealantStatus: enumField(doneNotDoneValues),
  sealantOperator: textField,
  sealantToothNumber: textField,
  sdfStatus: enumField(doneNotDoneValues),
  sdfOperator: textField,
  sdfToothNumber: textField,
  scalingStatus: enumField(doneNotDoneValues),
  scalingOperator: textField,
  scalingToothNumber: textField,

  // Remarks
  remarks: textField,

  // Additional fields
  image: z.string().nullable().optional(),
});

const createDentalInput = dentalFields.extend({
  visitId: z.number().int().positive(),
});

const updateDentalInput = dentalFields.extend({
  id: z.number().int().positive(),
});

export const dentalRouter = router({
  /**
   * Creates a dental consultation record for a patient visit.
   */
  create: protectedProcedure
    .input(createDentalInput)
    .mutation(async ({ input }) => {
      const [dentalRecord] = await db.insert(dental).values(input).returning();
      return dentalRecord;
    }),

  /**
   * Retrieves the dental record for a visit, or `null` if none exists.
   * `visit_id` is not unique on `dental`, so the newest record wins if
   * duplicates exist.
   */
  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const [dentalRecord] = await db
        .select(getTableColumns(dental))
        .from(dental)
        .where(eq(dental.visitId, input.visitId))
        .orderBy(desc(dental.id))
        .limit(1);

      return dentalRecord ?? null;
    }),

  /**
   * Updates a dental record by its ID. Only provided fields are changed;
   * pass `null` to clear a field.
   */
  update: protectedProcedure
    .input(updateDentalInput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const [updatedDental] = await db
        .update(dental)
        .set(updateData)
        .where(eq(dental.id, id))
        .returning();

      if (!updatedDental) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Dental record ${id} not found`,
        });
      }
      return updatedDental;
    }),
});

export type CreateDentalInput = z.infer<typeof createDentalInput>;
export type UpdateDentalInput = z.infer<typeof updateDentalInput>;
