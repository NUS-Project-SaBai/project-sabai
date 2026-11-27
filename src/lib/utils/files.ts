import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants/files";

/**
 * Why a file can't be uploaded, or null if it can. Shared by the upload form and the files
 * router so both give the same message.
 */
export function getFileError(size: number, contentType: string | undefined) {
  if (size === 0) return "File is empty";
  if (size > MAX_FILE_SIZE_BYTES) return "File is too large!";
  if (!(ALLOWED_FILE_TYPES as readonly unknown[]).includes(contentType))
    return "Only PDF, JPEG, PNG and DOCX files are allowed";
  return null;
}
