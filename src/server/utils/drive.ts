/*
 * Google Drive storage for patient files.
 * Files are uploaded by a service account into one folder. Whether a view link opens for
 * someone depends on how that folder is shared in Google Drive.
 *
 * Drive API docs: https://developers.google.com/workspace/drive/api/reference/rest/v3/files
 */
import { Readable } from "node:stream";
import { auth, drive as googleDrive, type drive_v3 } from "@googleapis/drive";
import { TRPCError } from "@trpc/server";
import env from "@/lib/envVariables";

let client: drive_v3.Drive | undefined;

// Created on first use so a missing or malformed key only fails file operations, not every import.
function getDrive() {
  const key = env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY;
  const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
  if (!key || !folderId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Google Drive is not configured",
    });
  }
  client ??= googleDrive({
    version: "v3",
    auth: new auth.GoogleAuth({
      credentials: JSON.parse(key),
      scopes: ["https://www.googleapis.com/auth/drive"],
    }),
  });
  return { drive: client, folderId };
}

/**
 * Runs a Drive call, logging Google's error on the server and giving the client
 * generic message, so folder IDs and service account details don't reach the browser and are not exposed there.
 */
async function callDrive<T>(
  action: string,
  run: (drive: drive_v3.Drive, folderId: string) => Promise<T>,
) {
  const { drive, folderId } = getDrive();
  try {
    return await run(drive, folderId);
  } catch (error) {
    console.error(`Google Drive ${action} failed`, error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not reach Google Drive",
    });
  }
}

/**
 * Uploads a file into the patient files folder.
 * @returns The Drive file ID.
 */
export async function uploadToDrive(file: File, fileName: string) {
  const body = Readable.from(Buffer.from(await file.arrayBuffer()));
  const { data } = await callDrive("upload", (drive, folderId) =>
    drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: file.type || "application/octet-stream", body },
      fields: "id",
      supportsAllDrives: true, // allows the folder to live in a Shared Drive
    }),
  );
  if (!data.id)
    throw new Error(`Google Drive did not return an ID for ${fileName}`);
  return data.id;
}

/**
 * Renames a file on Google Drive so it stays in sync with the name shown in the app.
 */
export async function renameDriveFile(fileId: string, fileName: string) {
  await callDrive("rename", (drive) =>
    drive.files.update({
      fileId,
      requestBody: { name: fileName },
      supportsAllDrives: true,
    }),
  );
}

/**
 * Permanently deletes a file from Google Drive. Only used to clean up uploads that never
 * got a database row; deleting a file in the app is a soft delete and keeps the Drive file.
 */
export async function deleteDriveFile(fileId: string) {
  await callDrive("delete", (drive) =>
    drive.files.delete({ fileId, supportsAllDrives: true }),
  );
}

/**
 * Builds the Drive link that opens the file in Google's viewer.
 */
export function getDriveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}
