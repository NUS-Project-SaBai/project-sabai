export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

// Types that are safe to open inline in the browser.
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
