import { z } from "zod";
import { zfd } from "zod-form-data";
import { uploadToCloudinary } from "@/server/utils/cloudinary";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { patients, genderEnum, Patient } from "@/db/schema";
import serverEnv from "@/lib/envVariables";
import { eq } from "drizzle-orm";

const cloudinaryUrlPrefix = serverEnv.CLOUDINARY_URL_PREFIX;

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
    ? `${cloudinaryUrlPrefix}/${patient.patientImagePublicId}`
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
        faceEncoding: patients.faceEncoding,
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
      zfd.formData({
        name: zfd.text(),
        identificationNumber: zfd.text(),
        gender: zfd.text(z.enum(genderEnum.enumValues)),
        dateOfBirth: zfd.text(z.coerce.date()),
        drugAllergy: zfd.text(),
        hasPoorCard: zfd.text(
          z.enum(["true", "false"]).transform((val) => val === "true"),
        ),
        hasBS2Card: zfd.text(
          z.enum(["true", "false"]).transform((val) => val === "true"),
        ),
        hasSabaiCard: zfd.text(
          z.enum(["true", "false"]).transform((val) => val === "true"),
        ),
        patientImage: zfd.file(),
      }),
    )
    .mutation(async ({ input }) => {
      // Upload image to Cloudinary and get the public ID
      const patientImagePublicId = await uploadToCloudinary(input.patientImage);

      const newPatientInput = { ...input, patientImagePublicId };

      const [newPatient] = await db
        .insert(patients)
        .values(newPatientInput)
        .returning();

      return newPatient;
    }),

  // Update patient
  update: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.numeric(z.number().int()), // ID must be included for updates
        name: zfd.text(z.string().optional()),
        identificationNumber: zfd.text(z.string().optional()),
        gender: zfd.text(z.enum(genderEnum.enumValues).optional()),
        dateOfBirth: zfd.text(z.coerce.date().optional()),
        drugAllergy: zfd.text(z.string().optional()),
        hasPoorCard: zfd.text(
          z
            .enum(["true", "false"])
            .transform((val) => val === "true")
            .optional(),
        ),
        hasBS2Card: zfd.text(
          z
            .enum(["true", "false"])
            .transform((val) => val === "true")
            .optional(),
        ),
        hasSabaiCard: zfd.text(
          z
            .enum(["true", "false"])
            .transform((val) => val === "true")
            .optional(),
        ),
        patientImage: zfd.file(z.instanceof(File).optional()),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, patientImage, ...updateData } = input;
      let patientImagePublicId;
      if (patientImage) {
        patientImagePublicId = await uploadToCloudinary(patientImage);
      }
      const [result] = await db
        .update(patients)
        .set({ ...updateData, patientImagePublicId })
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
