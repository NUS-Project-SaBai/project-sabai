import { z } from "zod";
import { zfd } from "zod-form-data";
import { uploadToCloudinary } from "@/server/utils/cloudinary";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { patients, genderEnum, yesNoEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

const cloudinaryUrlPrefix = process.env.CLOUDINARY_URL_PREFIX;
if (!cloudinaryUrlPrefix) {
  throw new Error("CLOUDINARY_URL environment variable is not set");
}

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
        poor: patients.poor,
        bs2: patients.bs2,
        drugAllergy: patients.drugAllergy,
        sabaiCard: patients.sabaiCard,
        patientImageUrl: patients.patientImageUrl,
      })
      .from(patients);

    return result.map((patient) => ({
      ...patient,
      patientImageUrl: patient.patientImageUrl
        ? `${cloudinaryUrlPrefix}/${patient.patientImageUrl}`
        : "",
    }));
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
          poor: patients.poor,
          bs2: patients.bs2,
          drugAllergy: patients.drugAllergy,
          sabaiCard: patients.sabaiCard,
          patientImageUrl: patients.patientImageUrl,
        })
        .from(patients)
        .where(eq(patients.id, input.id))
        .limit(1);

      if (result) {
        result.patientImageUrl = `${cloudinaryUrlPrefix}/${result.patientImageUrl}`;
      }

      return result ?? null;
    }),

  // Create new patient
  create: protectedProcedure
    .input(
      zfd.formData({
        name: zfd.text(z.string().min(1)),
        identificationNumber: zfd.text(z.string().optional()),
        gender: zfd.text(z.enum(genderEnum.enumValues)),
        dateOfBirth: zfd.text(z.coerce.date()),
        poor: zfd.text(z.enum(yesNoEnum.enumValues)),
        bs2: zfd.text(z.enum(yesNoEnum.enumValues)),
        drugAllergy: zfd.text(z.string().min(1)),
        sabaiCard: zfd.text(z.enum(yesNoEnum.enumValues)),
        patientImage: zfd.file(),
      }),
    )
    .mutation(async ({ input }) => {
      // Upload image to Cloudinary and get the public ID
      const patientImageUrl = await uploadToCloudinary(input.patientImage);

      const [newPatient] = await db
        .insert(patients)
        .values({ ...input, patientImageUrl })
        .returning();

      return newPatient;
    }),

  // Update patient
  update: protectedProcedure
    .input(
      zfd.formData({
        id: zfd.text(
          z
            .string()
            .min(1)
            .transform((val) => parseInt(val, 10)),
        ), // ID must be included for updates
        name: zfd.text(z.string()).optional(),
        identificationNumber: zfd.text(z.string().optional()),
        gender: zfd.text(z.enum(genderEnum.enumValues)).optional(),
        dateOfBirth: zfd.text(z.coerce.date()).optional(),
        poor: zfd.text(z.enum(yesNoEnum.enumValues)).optional(),
        bs2: zfd.text(z.enum(yesNoEnum.enumValues)).optional(),
        drugAllergy: zfd.text(z.string().min(1)).optional(),
        sabaiCard: zfd.text(z.enum(yesNoEnum.enumValues)).optional(),
        patientImage: zfd.file().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, patientImage, ...updateData } = input;
      let patientImageUrl;
      if (patientImage) {
        patientImageUrl = await uploadToCloudinary(patientImage);
      }
      const [result] = await db
        .update(patients)
        .set({ ...updateData, patientImageUrl })
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
