import { randomUUID } from "crypto";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import env, { type ServerEnv } from "@/lib/envVariables";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/server/utils/cloudinary";

/*
 * Patient images are stored in Cloudinary when APP_MODE is ONLINE, and in the
 * local RustFS container (infra/storage, S3-compatible) when APP_MODE is OFFLINE.
 * Either way an image is identified by an opaque id, which is what
 * patients.patientImagePublicId holds.
 */

type OfflineEnv = Extract<ServerEnv, { APP_MODE: "OFFLINE" }>;

// Offline image ids are S3 keys under this prefix. They have no file extension
// on purpose: the auth proxy (src/proxy.ts) skips paths ending in .jpg etc.
const PATIENT_IMAGE_PREFIX = "patients/";

/** Route that serves offline images to signed-in users. */
export const OFFLINE_IMAGE_ROUTE = "/api/images/";

/**
 * Stores a patient image.
 * @returns The id to save in patients.patientImagePublicId.
 */
export async function uploadPatientImage(image: File): Promise<string> {
  if (env.APP_MODE === "ONLINE") return uploadToCloudinary(image);

  const key = `${PATIENT_IMAGE_PREFIX}${randomUUID()}`;
  await ensureBucket(env);
  await getS3Client(env).send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: Buffer.from(await image.arrayBuffer()),
      ContentType: image.type || "image/jpeg",
    }),
  );
  return key;
}

/** Deletes a patient image by the id returned from {@link uploadPatientImage}. */
export async function deletePatientImage(id: string) {
  if (env.APP_MODE === "ONLINE") return deleteFromCloudinary(id);

  await getS3Client(env).send(
    new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: id }),
  );
}

/** URL the browser loads a patient image from. */
export function getPatientImageUrl(id: string) {
  if (env.APP_MODE === "ONLINE") return `${env.CLOUDINARY_URL_PREFIX}/${id}`;

  return `${OFFLINE_IMAGE_ROUTE}${id.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Reads an offline patient image for the image route.
 * @returns null when not in OFFLINE mode, the id isn't a patient image, or it doesn't exist.
 */
export async function getOfflinePatientImage(id: string) {
  if (env.APP_MODE !== "OFFLINE" || !isPatientImageKey(id)) return null;

  try {
    const object = await getS3Client(env).send(
      new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: id }),
    );
    if (!object.Body) return null;
    return {
      body: object.Body,
      contentType: object.ContentType ?? "application/octet-stream",
      contentLength: object.ContentLength,
    };
  } catch (err) {
    if (err instanceof S3ServiceException && err.name === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

function isPatientImageKey(id: string) {
  return (
    id.startsWith(PATIENT_IMAGE_PREFIX) &&
    id.length > PATIENT_IMAGE_PREFIX.length &&
    !id.split("/").some((segment) => segment === "" || segment === "..")
  );
}

let s3Client: S3Client | undefined;

function getS3Client(env: OfflineEnv) {
  s3Client ??= new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    // RustFS ignores the region, but the SDK requires one to sign requests.
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
    },
    // Newer SDKs add checksums to every request by default, which S3-compatible
    // stores don't all support.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return s3Client;
}

let bucketReady: Promise<void> | undefined;

/** Creates the bucket on first upload, so a fresh RustFS volume needs no setup. */
function ensureBucket(env: OfflineEnv) {
  bucketReady ??= getS3Client(env)
    .send(new CreateBucketCommand({ Bucket: env.STORAGE_BUCKET }))
    .then(
      () => undefined,
      (err) => {
        if (
          err instanceof S3ServiceException &&
          (err.name === "BucketAlreadyOwnedByYou" ||
            err.name === "BucketAlreadyExists")
        ) {
          return;
        }
        bucketReady = undefined; // retry on the next upload
        throw err;
      },
    );
  return bucketReady;
}
