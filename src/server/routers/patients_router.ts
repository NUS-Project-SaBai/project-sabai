import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { patients, genderEnum, Patient } from "@/db/schema";
import { eq } from "drizzle-orm";

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  throw new Error("CLOUDINARY_URL environment variable is not set");
}

/**
 * Transforms a patient object by adding a complete image URL.
 *
 * @param patient - The patient object to transform
 * @returns A new patient object with the `patientImageUrl` property added. If the patient has a `patientImagePublicId`,
 *          the URL is constructed as `{cloudinaryUrl}/{patientImagePublicId}`. Otherwise, `patientImageUrl` is `null`.
 */
const getPatientWithImageUrl = (patient: Patient) => ({
  ...patient,
  patientImageUrl: patient.patientImagePublicId
    ? `${cloudinaryUrl}/${patient.patientImagePublicId}`
    : null,
});

export const patientsRouter = router({
  // List all patients with village details
  list: protectedProcedure.query(async () => {
    const result = await db
      .select({
        id: patients.id,
        name: patients.name,
        identificationNumber: patients.identificationNumber,
        contactNo: patients.contactNo,
        gender: patients.gender,
        dateOfBirth: patients.dateOfBirth,
        hasPoorCard: patients.hasPoorCard,
        hasBS2Card: patients.hasBS2Card,
        drugAllergy: patients.drugAllergy,
        hasSabaiCard: patients.hasSabaiCard,
        patientImagePublicId: patients.patientImagePublicId,
      })
      .from(patients);

    return result.map(getPatientWithImageUrl);
  }),

  // Get single patient by ID with village details
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({
          id: patients.id,
          name: patients.name,
          identificationNumber: patients.identificationNumber,
          contactNo: patients.contactNo,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          drugAllergy: patients.drugAllergy,
          hasPoorCard: patients.hasPoorCard,
          hasBS2Card: patients.hasBS2Card,
          hasSabaiCard: patients.hasSabaiCard,
          patientImagePublicId: patients.patientImagePublicId,
        })
        .from(patients)
        .where(eq(patients.id, input.id))
        .limit(1);

      if (result) {
        // Create patientImageUrl via map function based on patientImagePublicId and CLOUDINARY_URL
        return getPatientWithImageUrl(result);
      }

      return null;
    }),

  // Create new patient
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        identificationNumber: z.string().optional(),
        contactNo: z.string().optional(),
        gender: z.enum(genderEnum.enumValues), // Matches schema enum
        dateOfBirth: z.coerce.date(), // Auto-parses strings/dates
        drugAllergy: z.string().min(0),
        hasPoorCard: z.boolean(),
        hasBS2Card: z.boolean(),
        hasSabaiCard: z.boolean(),
        patientImagePublicId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newPatient] = await db.insert(patients).values(input).returning();
      return getPatientWithImageUrl(newPatient);
    }),

  // Update patient
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        identificationNumber: z.string().optional(),
        contactNo: z.string().optional(),
        gender: z.enum(genderEnum.enumValues).optional(),
        dateOfBirth: z.coerce.date().optional(),
        drugAllergy: z.string().optional(),
        hasPoorCard: z.boolean().optional(),
        hasBS2Card: z.boolean().optional(),
        hasSabaiCard: z.boolean().optional(),
        patientImagePublicId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [result] = await db
        .update(patients)
        .set(updateData)
        .where(eq(patients.id, id))
        .returning();

      return result ? getPatientWithImageUrl(result) : null;
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
