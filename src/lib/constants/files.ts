export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
