import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { dental, dentalDiagnosis } from "@/db/schema";
import type { Dental, DentalWithDiagnoses } from "@/db/schema";
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

/**
 * The full list of diagnosis descriptions for a consultation, in display
 * order. Blank entries are rejected; the form drops them before sending.
 */
const diagnosesField = z.array(z.string().trim().min(1)).optional();

const createDentalInput = dentalFields.extend({
  visitId: z.number().int().positive(),
  diagnoses: diagnosesField,
});

const updateDentalInput = dentalFields.extend({
  id: z.number().int().positive(),
  diagnoses: diagnosesField,
});

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const insertDiagnoses = async (
  tx: DbOrTx,
  dentalId: number,
  descriptions: string[],
) => {
  if (descriptions.length === 0) return;
  await tx
    .insert(dentalDiagnosis)
    .values(descriptions.map((description) => ({ dentalId, description })));
};

/** Attaches a record's diagnoses, oldest first (the order they were entered). */
const withDiagnoses = async (
  tx: DbOrTx,
  record: Dental,
): Promise<DentalWithDiagnoses> => {
  const diagnoses = await tx
    .select()
    .from(dentalDiagnosis)
    .where(eq(dentalDiagnosis.dentalId, record.id))
    .orderBy(asc(dentalDiagnosis.id));
  return { ...record, diagnoses };
};

export const dentalRouter = router({
  /**
   * Creates a dental consultation record for a patient visit, with its
   * diagnoses, in a single transaction.
   */
  create: protectedProcedure
    .input(createDentalInput)
    .mutation(async ({ input }) => {
      const { diagnoses = [], ...dentalData } = input;

      return db.transaction(async (tx) => {
        const [dentalRecord] = await tx
          .insert(dental)
          .values(dentalData)
          .returning();
        await insertDiagnoses(tx, dentalRecord.id, diagnoses);
        return withDiagnoses(tx, dentalRecord);
      });
    }),

  /**
   * Retrieves the dental record for a visit with its diagnoses, or `null` if
   * none exists. `visit_id` is not unique on `dental`, so the newest record
   * wins if duplicates exist.
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

      return dentalRecord ? withDiagnoses(db, dentalRecord) : null;
    }),

  /**
   * Updates a dental record by its ID. Only provided fields are changed;
   * pass `null` to clear a field. A provided `diagnoses` list replaces the
   * record's diagnoses; omit it to leave them untouched.
   */
  update: protectedProcedure
    .input(updateDentalInput)
    .mutation(async ({ input }) => {
      const { id, diagnoses, ...updateData } = input;

      return db.transaction(async (tx) => {
        // Drizzle rejects an empty SET, so a diagnoses-only update just
        // looks the record up.
        const [updatedDental] =
          Object.keys(updateData).length > 0
            ? await tx
                .update(dental)
                .set(updateData)
                .where(eq(dental.id, id))
                .returning()
            : await tx.select().from(dental).where(eq(dental.id, id));

        if (!updatedDental) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Dental record ${id} not found`,
          });
        }

        if (diagnoses) {
          await tx
            .delete(dentalDiagnosis)
            .where(eq(dentalDiagnosis.dentalId, id));
          await insertDiagnoses(tx, id, diagnoses);
        }
        return withDiagnoses(tx, updatedDental);
      });
    }),
});

export type CreateDentalInput = z.infer<typeof createDentalInput>;
export type UpdateDentalInput = z.infer<typeof updateDentalInput>;
