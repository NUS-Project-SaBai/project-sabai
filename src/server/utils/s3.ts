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
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import env from "@/lib/envVariables";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants/files";

/** Where patient files are stored. Every method throws a TRPCError if storage fails. */
export interface FileStorage {
  /**
   * Creates a presigned POST the browser uploads one file with. S3 itself refuses the upload
   * unless the file is 1 byte to MAX_FILE_SIZE_BYTES and sent with exactly `contentType`, so
   * nothing that breaks the rules is ever stored.
   * @returns The new object key, plus the `url` and form `fields` to POST the file with.
   */
  createUploadPost(
    patientId: number,
    contentType: string,
  ): Promise<{ key: string; url: string; fields: Record<string, string> }>;

  /**
   * Reads what was actually uploaded, since the browser controls the upload body.
   * @returns The object's size and type, or null if nothing was uploaded under the key.
   */
  getObjectInfo(
    key: string,
  ): Promise<{ size: number; contentType: string | undefined } | null>;

  /**
   * Permanently deletes a file. Only used to clean up uploads that were rejected or never
   * got a database row; deleting a file in the app is a soft delete and keeps the object.
   */
  delete(key: string): Promise<void>;

  /**
   * Builds a link that opens the file in the browser for VIEW_URL_EXPIRY_SECONDS, under
   * `fileName` and served as `contentType`.
   */
  getViewUrl(
    key: string,
    fileName: string,
    contentType: string,
  ): Promise<string>;
}

// How long a view link from getViewUrl stays valid.
export const VIEW_URL_EXPIRY_SECONDS = 60 * 60;

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

class S3FileStorage implements FileStorage {
  private readonly client = new S3Client();

  async createUploadPost(patientId: number, contentType: string) {
    const key = `${patientKeyPrefix(patientId)}${randomUUID()}`;
    const { url, fields } = await callS3("presign upload", (bucket) =>
      createPresignedPost(this.client, {
        Bucket: bucket,
        Key: key,
        Conditions: [
          ["content-length-range", 1, MAX_FILE_SIZE_BYTES],
          ["eq", "$Content-Type", contentType],
        ],
        Fields: { "Content-Type": contentType },
      }),
    );
    return { key, url, fields };
  }

  async getObjectInfo(key: string) {
    return callS3("head", async (bucket) => {
      try {
        const head = await this.client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return { size: head.ContentLength ?? 0, contentType: head.ContentType };
      } catch (error) {
        if ((error as { name?: string }).name === "NotFound") return null;
        throw error;
      }
    });
  }

  async delete(key: string) {
    await callS3("delete", (bucket) =>
      this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
    );
  }

  // S3 objects can't be renamed, so the current file name is applied here through
  // Content-Disposition. The type is forced to the one recorded at upload, so the object
  // can't be served as anything else.
  async getViewUrl(key: string, fileName: string, contentType: string) {
    return callS3("presign", (bucket) =>
      getSignedUrl(
        this.client,
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
}

export const fileStorage: FileStorage = new S3FileStorage();
