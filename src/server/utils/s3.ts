/*
 * Amazon S3 storage for patient files.
 * The bucket is private. Browsers upload and view files through short-lived presigned URLs,
 * so file bytes never pass through our server (Vercel caps request bodies at 4.5MB) and a
 * leaked link stops working once it expires. This uses the same AWS credentials as Rekognition.
 *
 * S3 API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
 */
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import env from "@/lib/envVariables";

// How long a view link from getS3ViewUrl stays valid.
export const VIEW_URL_EXPIRY_SECONDS = 60 * 60;

const client = new S3Client();

// A missing bucket only fails file operations, not every import.
function getBucket() {
  const bucket = env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3 is not configured",
    });
  }
  return bucket;
}

/**
 * Runs an S3 call, logging AWS's error on the server and giving the client a generic
 * message, so bucket names and account details are not exposed in the browser.
 */
async function callS3<T>(action: string, run: (bucket: string) => Promise<T>) {
  const bucket = getBucket();
  try {
    return await run(bucket);
  } catch (error) {
    console.error(`S3 ${action} failed`, error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not reach file storage",
    });
  }
}

/**
 * The folder a patient's files live in. Keys are random so names never clash and the
 * file name (which may hold patient details) is kept out of them.
 */
export function patientKeyPrefix(patientId: number) {
  return `patients/${patientId}/`;
}

/**
 * Creates a presigned PUT link the browser uploads one file to.
 * @returns The new object key and the upload link.
 */
export async function createS3UploadUrl(
  patientId: number,
  contentType: string,
) {
  const key = `${patientKeyPrefix(patientId)}${randomUUID()}`;
  const uploadUrl = await callS3("presign upload", (bucket) =>
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
    ),
  );
  return { key, uploadUrl };
}

/**
 * Reads what was actually uploaded, since the browser controls the upload body.
 * @returns The object's size and type, or null if nothing was uploaded under the key.
 */
export async function getS3ObjectInfo(key: string) {
  return callS3("head", async (bucket) => {
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return { size: head.ContentLength ?? 0, contentType: head.ContentType };
    } catch (error) {
      if ((error as { name?: string }).name === "NotFound") return null;
      throw error;
    }
  });
}

/**
 * Permanently deletes a file from S3. Only used to clean up uploads that were rejected or
 * never got a database row; deleting a file in the app is a soft delete and keeps the object.
 */
export async function deleteFromS3(key: string) {
  await callS3("delete", (bucket) =>
    client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
  );
}

/**
 * Builds a presigned link that opens the file in the browser. S3 objects can't be
 * renamed, so the current file name is applied here through Content-Disposition. The type
 * is forced to the one recorded at upload, so the object can't be served as anything else.
 */
export async function getS3ViewUrl(
  key: string,
  fileName: string,
  contentType: string,
) {
  return callS3("presign", (bucket) =>
    getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: contentType,
        ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn: VIEW_URL_EXPIRY_SECONDS },
    ),
  );
}
