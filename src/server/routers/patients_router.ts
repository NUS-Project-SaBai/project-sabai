import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/server/utils/cloudinary";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { patients, genderEnum, visits } from "@/db/schema/patients";
import { villageCodes } from "@/db/schema/villageCodes";
import serverEnv from "@/lib/envVariables";
import { TRPCError } from "@trpc/server";
import { eq, and, ne, desc, inArray, isNotNull } from "drizzle-orm";
import {
  generateFaceprint,
  searchFaceprint,
  deleteFaceprint,
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
        contactNo: zfd.text(z.string().optional()),
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

      // Reject an identificationNumber that already belongs to a different
      // patient. This is the guard against creating duplicate IDs via updates.
      if (updateData.identificationNumber) {
        const [conflict] = await db
          .select({ id: patients.id })
          .from(patients)
          .where(
            and(
              eq(
                patients.identificationNumber,
                updateData.identificationNumber,
              ),
              ne(patients.id, id),
            ),
          )
          .limit(1);

        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Another patient already has this identification number.",
          });
        }
      }

      let imageUpdate: {
        patientImagePublicId?: string;
        rekognitionFaceId?: string;
      } = {};

      // Client sends a new base64 image (recapture)
      if (patientImage) {
        // Reads patient's current Cloudinary image id and Rekognition face id before overwriting them
        const [existing] = await db
          .select({
            patientImagePublicId: patients.patientImagePublicId,
            rekognitionFaceId: patients.rekognitionFaceId,
          })
          .from(patients)
          .where(eq(patients.id, id))
          .limit(1);

        const imageFile: File = dataUrlToFile(
          patientImage,
          `${input.name ?? id}.jpg`,
        );

        const [patientImagePublicId, rekognitionFaceId] = await Promise.all([
          uploadToCloudinary(imageFile),
          generateFaceprint(patientImage),
        ]);
        imageUpdate = { patientImagePublicId, rekognitionFaceId };

        // No faceprint means the new photo wasn't indexed; keep the old one so
        // the patient stays searchable by face.
        if (!rekognitionFaceId) {
          console.warn(
            `Faceprint not generated for patient ${id}; new photo is not searchable by face. Keeping previous faceprint.`,
          );
        }

        // Best-effort cleanup of the replaced assets.
        if (existing?.patientImagePublicId) {
          await deleteFromCloudinary(existing.patientImagePublicId).catch(
            (err) => console.error("Failed to delete old patient image:", err),
          );
        }
        if (rekognitionFaceId && existing?.rekognitionFaceId) {
          await deleteFaceprint(existing.rekognitionFaceId);
        }
      }

      const [result] = await db
        .update(patients)
        .set({ ...updateData, ...imageUpdate })
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
