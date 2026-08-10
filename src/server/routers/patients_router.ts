import { z } from "zod";
import { zfd } from "zod-form-data";
import { uploadToCloudinary } from "@/server/utils/cloudinary";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { patients, genderEnum, visits } from "@/db/schema/schema";
import { villageCodes } from "@/db/schema/villageCodes";
import serverEnv from "@/lib/envVariables";
import { TRPCError } from "@trpc/server";
import { eq, desc, inArray, isNotNull } from "drizzle-orm";
import {
  generateFaceprint,
  searchFaceprint,
  dataUrlToFile,
} from "@/lib/utils/facialRecognition";

const cloudinaryUrlPrefix = serverEnv.CLOUDINARY_URL_PREFIX;

/**
 * Transforms a patient object by adding a complete image URL.
 *
 * @param patient - The patient object to transform
 * @returns A new patient object with the `patientImageUrl` property added. If the patient has a `patientImagePublicId`,
 *          the URL is constructed as `{cloudinaryUrl}/{patientImagePublicId}`. Otherwise, `patientImageUrl` is `null`.
 */
const getPatientWithImageUrl = <
  T extends { patientImagePublicId: string | null },
>(
  patient: T,
) => ({
  ...patient,
  patientImageUrl: patient.patientImagePublicId
    ? `${cloudinaryUrlPrefix}/${patient.patientImagePublicId}`
    : null,
});

export const patientsRouter = router({
  // List all of patients (no visit data)
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
        rekognitionFaceId: patients.rekognitionFaceId,
      })
      .from(patients);

    return result.map(getPatientWithImageUrl);
  }),

  // List all patients, along with village info from their most recent visit
  listWithLatestVisit: protectedProcedure.query(async () => {
    // DISTINCT ON keeps one row per patient, the latest by visit date
    const latestVisit = db
      .selectDistinctOn([visits.patientId], {
        patientId: visits.patientId,
        villageCodeId: visits.villageCodeId,
        date: visits.date,
      })
      .from(visits)
      .orderBy(visits.patientId, desc(visits.date))
      .as("latest_visit");

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
        rekognitionFaceId: patients.rekognitionFaceId,
        villageCode: villageCodes.code,
        villageColorHex: villageCodes.colorHex,
      })
      .from(patients)
      .leftJoin(latestVisit, eq(latestVisit.patientId, patients.id))
      .leftJoin(villageCodes, eq(villageCodes.id, latestVisit.villageCodeId))
      // Patients with a visit first (isNotNull true sorts before false), then
      // most recent visit on top; visit-less patients sink to the bottom.
      .orderBy(desc(isNotNull(latestVisit.date)), desc(latestVisit.date));

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
          rekognitionFaceId: patients.rekognitionFaceId,
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
        hasPoorCard: z.boolean(),
        hasBS2Card: z.boolean(),
        hasSabaiCard: z.boolean(),
        patientImage: z.string(),
        contactNo: z.string(),
        villageCodeId: zfd.text(z.coerce.number().int().optional()),
      }),
    )
    .mutation(async ({ input }) => {
      const { villageCodeId, ...patientData } = input;

      if (!villageCodeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Village code is required for patient registration",
        });
      }

      if (!input.patientImage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Patient image is required for patient registration",
        });
      }

      const patientImage: File = dataUrlToFile(
        input.patientImage,
        `${input.name}.jpg`,
      );

      const [patientImagePublicId, rekognitionFaceId] = await Promise.all([
        uploadToCloudinary(patientImage),
        generateFaceprint(input.patientImage),
      ]);

      const newPatientInput = {
        ...patientData,
        patientImagePublicId,
        rekognitionFaceId,
      };

      const [newPatient] = await db
        .insert(patients)
        .values(newPatientInput)
        .returning();

      // Automatically create the patient's first visit
      await db.insert(visits).values({
        patientId: newPatient.id,
        villageCodeId: villageCodeId,
        date: new Date(),
      });

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
        hasPoorCard: z.boolean().optional(),
        hasBS2Card: z.boolean().optional(),
        hasSabaiCard: z.boolean().optional(),
        patientImage: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, patientImage, ...updateData } = input;
      let patientImagePublicId;
      if (patientImage) {
        const patientImage: File = dataUrlToFile(
          input.patientImage!, // Temporarily add non-null operator until later refactoring
          `${input.name}.jpg`,
        );
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

  // searchPatientsByPicture uses AWS Rekognition to find matching patients based on a provided face image.
  // It returns an array of patients whose rekognitionFaceId matches any of the FaceIds found in the search results.
  // NOTE: Though this endpoint does not modify any data, it is a mutation because it receives a base64-encoded image as input, which can be large.
  // Using a mutation allows for larger payloads compared to a query.
  searchPatientsByPicture: protectedProcedure
    .input(z.object({ picture: z.string() }))
    .mutation(async ({ input }) => {
      // Step 1: Search for faceprint matches using the provided picture
      let searchFaceprintResults;
      try {
        searchFaceprintResults = await searchFaceprint(input.picture);
        // If there are no matches, return an empty array
        if (!searchFaceprintResults || searchFaceprintResults.length === 0) {
          return [];
        }
      } catch (err) {
        // Log the error and return an empty array if the search fails
        console.error("error searchFaceprint:", err);
        return [];
      }

      // get the FaceIds from the search results, filtering out any undefined values
      const faceIds = searchFaceprintResults
        .map((item) => item.Face?.FaceId)
        .filter((id): id is string => typeof id === "string"); // use Type Predicate to ensure TypeScript knows these are strings

      if (faceIds.length === 0) {
        return [];
      }

      // Step 2: Query the database for patients whose rekognitionFaceId matches any of the FaceIds found
      const matchingPatients = await db
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
          rekognitionFaceId: patients.rekognitionFaceId,
        })
        .from(patients)
        .where(inArray(patients.rekognitionFaceId, faceIds));

      return matchingPatients.map(getPatientWithImageUrl);
    }),
});
