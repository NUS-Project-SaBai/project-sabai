import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { patients, villageCodes, genderEnum, yesNoEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export const patientsRouter = router({
  // List all patients with village details
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: patients.id,
        villageCode: villageCodes.code,
        name: patients.name,
        identificationNumber: patients.identificationNumber,
        contactNo: patients.contactNo,
        gender: patients.gender,
        dateOfBirth: patients.dateOfBirth,
        poor: patients.poor,
        bs2: patients.bs2,
        drugAllergy: patients.drugAllergy,
        sabaiCard: patients.sabaiCard,
      })
      .from(patients)
      .innerJoin(villageCodes, eq(patients.villageCodeId, villageCodes.id));

    return result;
  }),

  // Get single patient by ID with village details
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({
          id: patients.id,
          villageCode: villageCodes.code,
          name: patients.name,
          identificationNumber: patients.identificationNumber,
          contactNo: patients.contactNo,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          poor: patients.poor,
          bs2: patients.bs2,
          drugAllergy: patients.drugAllergy,
          sabaiCard: patients.sabaiCard,
        })
        .from(patients)
        .innerJoin(villageCodes, eq(patients.villageCodeId, villageCodes.id))
        .where(eq(patients.id, input.id))
        .limit(1);

      return result ?? null;
    }),

  // Create new patient
  create: protectedProcedure
    .input(
      z.object({
        villageCodeId: z.bigint(),
        name: z.string().min(1, "Name is required"),
        identificationNumber: z.string().optional(),
        contactNo: z.string().optional(),
        gender: z.enum(genderEnum.enumValues), // Matches schema enum
        dateOfBirth: z.coerce.date(), // Auto-parses strings/dates
        drugAllergy: z.string().min(0),
        poor: z.enum(yesNoEnum.enumValues), // Matches schema enum
        bs2: z.enum(yesNoEnum.enumValues), // Keep varchar as-is
        sabaiCard: z.enum(yesNoEnum.enumValues), // Keep varchar as-is
      }),
    )
    .mutation(async ({ input }) => {
      const [newPatient] = await db.insert(patients).values(input).returning();
      return newPatient;
    }),

  // Update patient
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        villageCodeId: z.bigint().optional(),
        name: z.string().min(1).optional(),
        identificationNumber: z.string().optional(),
        contactNo: z.string().optional(),
        gender: z.enum(genderEnum.enumValues).optional(),
        dateOfBirth: z.coerce.date().optional(),
        drugAllergy: z.string().optional(),
        poor: z.enum(yesNoEnum.enumValues).optional(),
        bs2: z.enum(yesNoEnum.enumValues).optional(),
        sabaiCard: z.enum(yesNoEnum.enumValues).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(patients)
        .set(updateData)
        .where(eq(patients.id, id))
        .returning();

      return result ?? null;
    }),

  // Delete patient
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [result] = await db
        .delete(patients)
        .where(eq(patients.id, input.id))
        .returning({ id: patients.id });

      return { success: !!result };
    }),
});
