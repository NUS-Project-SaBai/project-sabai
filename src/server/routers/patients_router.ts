import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/server/utils/cloudinary";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { patients, genderValues, visits } from "@/db/schema/patients";
import { vitals, childVitals, puberty } from "@/db/schema/vitals";
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
import { calculateAge } from "@/lib/utils/patient";

const cloudinaryUrlPrefix = serverEnv.CLOUDINARY_URL_PREFIX;

type ReplacementImage = {
  imageUpdate: {
    patientImagePublicId: string;
    rekognitionFaceId?: string;
  };
  previous: {
    patientImagePublicId: string;
    rekognitionFaceId: string | null;
  };
};

/**
 * Uploads a replacement photo and faceprint. Returns null when the patient
 * does not exist. `rekognitionFaceId` is omitted when the new photo could not
 * be indexed, so the previous faceprint stays in place.
 *
 * Previous assets are not deleted here. Call `deleteReplacedPatientAssets`
 * only after the new ids have been saved, so a failed write keeps the old photo.
 */
async function uploadReplacementPatientImage(
  id: number,
  patientImage: string,
  fileName: string,
): Promise<ReplacementImage | null> {
  const [existing] = await db
    .select({
      patientImagePublicId: patients.patientImagePublicId,
      rekognitionFaceId: patients.rekognitionFaceId,
    })
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  if (!existing) {
    return null;
  }

  const imageFile: File = dataUrlToFile(patientImage, fileName);

  const [patientImagePublicId, rekognitionFaceId] = await Promise.all([
    uploadToCloudinary(imageFile),
    generateFaceprint(patientImage),
  ]);

  // No faceprint means the new photo wasn't indexed; keep the old one so
  // the patient stays searchable by face.
  if (!rekognitionFaceId) {
    console.warn(
      `Faceprint not generated for patient ${id}; new photo is not searchable by face. Keeping previous faceprint.`,
    );
  }

  return {
    imageUpdate: {
      patientImagePublicId,
      ...(rekognitionFaceId ? { rekognitionFaceId } : {}),
    },
    previous: existing,
  };
}

/** Best-effort cleanup. Skips an asset another patient still references. */
async function deleteReplacedPatientAssets(
  id: number,
  previous: ReplacementImage["previous"],
  next: ReplacementImage["imageUpdate"],
) {
  if (
    previous.patientImagePublicId &&
    previous.patientImagePublicId !== next.patientImagePublicId
  ) {
    const [sharedImage] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          ne(patients.id, id),
          eq(patients.patientImagePublicId, previous.patientImagePublicId),
        ),
      )
      .limit(1);
    if (!sharedImage) {
      await deleteFromCloudinary(previous.patientImagePublicId).catch((err) =>
        console.error("Failed to delete old patient image:", err),
      );
    }
  }

  if (
    next.rekognitionFaceId &&
    previous.rekognitionFaceId &&
    previous.rekognitionFaceId !== next.rekognitionFaceId
  ) {
    const [sharedFace] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          ne(patients.id, id),
          eq(patients.rekognitionFaceId, previous.rekognitionFaceId),
        ),
      )
      .limit(1);
    if (!sharedFace) {
      await deleteFaceprint(previous.rekognitionFaceId);
    }
  }
}

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
      zfd
        .formData({
          name: zfd.text(),
          identificationNumber: zfd.text(),
          gender: zfd.text(z.enum(genderValues)),
          dateOfBirth: zfd.text(z.coerce.date()),
          drugAllergy: zfd.text(),
          hasPoorCard: z.boolean(),
          hasBS2Card: z.boolean(),
          hasSabaiCard: z.boolean(),
          patientImage: z.string(),
          contactNo: z.string(),
          villageCodeId: zfd.text(z.coerce.number().int().optional()),
          scoliosis: z.enum(["normal", "abnormal"]).optional(),
          pallor: z.boolean().optional(),
          pubarche: z.boolean().optional(),
          pubarcheAge: z.number().int().positive().optional(),
        })
        .superRefine((data, ctx) => {
          // pubarcheAge is only considered meaningful when pubarche is true
          if (data.pubarcheAge !== undefined && data.pubarche !== true) {
            ctx.addIssue({
              code: "custom",
              message: "pubarcheAge requires pubarche to be true",
              path: ["pubarcheAge"],
            });
          }
        }),
    )
    .mutation(async ({ input }) => {
      const {
        villageCodeId,
        scoliosis,
        pallor,
        pubarche,
        pubarcheAge,
        dateOfBirth,
        ...patientData
      } = input;

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

      // Re-derive pediatric status server-side
      const isPediatric = calculateAge(dateOfBirth) < 18;

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
        dateOfBirth,
        patientImagePublicId,
        rekognitionFaceId,
      };

      const [newPatient] = await db
        .insert(patients)
        .values(newPatientInput)
        .returning();

      // Automatically create the patient's first visit
      const [newVisit] = await db
        .insert(visits)
        .values({
          patientId: newPatient.id,
          villageCodeId: villageCodeId,
          date: new Date(),
        })
        .returning();

      // Only persist child vitals when the patient is actually pediatric
      // and at least one child field was provided.
      const hasChildVitals =
        isPediatric &&
        (scoliosis !== undefined ||
          pallor !== undefined ||
          pubarche !== undefined);
      if (hasChildVitals) {
        await db.transaction(async (tx) => {
          const [vitalsRecord] = await tx
            .insert(vitals)
            .values({ visitId: newVisit.id })
            .returning();

          await tx
            .insert(childVitals)
            .values({ scoliosis, pallor, vitalId: vitalsRecord.id });

          if (pubarche !== undefined) {
            await tx
              .insert(puberty)
              .values({ pubarche, pubarcheAge, vitalId: vitalsRecord.id });
          }
        });
      }

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
        gender: zfd.text(z.enum(genderValues).optional()),
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

      if (updateData.identificationNumber !== undefined) {
        updateData.identificationNumber =
          updateData.identificationNumber.trim();
      }

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

      let uploaded: ReplacementImage | null = null;

      // Client sends a new base64 image (recapture)
      if (patientImage) {
        uploaded = await uploadReplacementPatientImage(
          id,
          patientImage,
          `${input.name ?? id}.jpg`,
        );
      }

      const [result] = await db
        .update(patients)
        .set({ ...updateData, ...uploaded?.imageUpdate })
        .where(eq(patients.id, id))
        .returning();

      if (result && uploaded) {
        await deleteReplacedPatientAssets(
          id,
          uploaded.previous,
          uploaded.imageUpdate,
        );
      }

      return result ? getPatientWithImageUrl(result) : null;
    }),

  // Replace a patient's face photo with a newly captured picture and open a visit.
  // Used when facial recognition does not find a returning patient.
  updateFace: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        patientImage: z.string().min(1),
        villageCodeId: z.number().int(),
      }),
    )
    .mutation(async ({ input }) => {
      const uploaded = await uploadReplacementPatientImage(
        input.id,
        input.patientImage,
        `${input.id}.jpg`,
      );

      if (!uploaded) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patient not found.",
        });
      }

      const saved = await db.transaction(async (tx) => {
        const [updatedPatient] = await tx
          .update(patients)
          .set(uploaded.imageUpdate)
          .where(eq(patients.id, input.id))
          .returning();

        if (!updatedPatient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found.",
          });
        }

        const [newVisit] = await tx
          .insert(visits)
          .values({
            patientId: input.id,
            villageCodeId: input.villageCodeId,
            date: new Date(),
          })
          .returning();

        return {
          patient: getPatientWithImageUrl(updatedPatient),
          visit: newVisit,
        };
      });

      await deleteReplacedPatientAssets(
        input.id,
        uploaded.previous,
        uploaded.imageUpdate,
      );

      return saved;
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
