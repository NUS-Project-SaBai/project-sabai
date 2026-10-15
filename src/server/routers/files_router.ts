import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { files, patients } from "@/db/schema";
import {
  createS3UploadUrl,
  deleteFromS3,
  getS3ObjectInfo,
  getS3ViewUrl,
  patientKeyPrefix,
} from "@/server/utils/s3";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants/files";

// Rejects a file whose size or type isn't allowed. Checked both before upload and against
// what S3 actually holds.
function fileError(size: number, contentType: string | undefined) {
  if (size === 0) return "File is empty";
  if (size > MAX_FILE_SIZE_BYTES) return "File is too large!";
  if (!(ALLOWED_FILE_TYPES as readonly unknown[]).includes(contentType))
    return "Only PDF, JPEG and PNG files are allowed";
  return null;
}

function badRequest(message: string) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}

function throwIfMissing(row: unknown, id: number) {
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: `File ${id} not found` });
  }
}

export const filesRouter = router({
  // A patient's files, newest first, each with a view link that expires after an hour.
  // Refetch rather than storing the links.
  listByPatientId: protectedProcedure
    .input(z.object({ patientId: z.number().int() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(files)
        .where(
          and(eq(files.patientId, input.patientId), eq(files.isDeleted, false)),
        )
        .orderBy(desc(files.createdAt));
      return Promise.all(
        rows.map(async (file) => ({
          ...file,
          fileUrl: await getS3ViewUrl(
            file.s3Key,
            file.fileName,
            file.contentType,
          ),
        })),
      );
    }),

  // Step 1 of an upload: returns a presigned PUT link. The browser PUTs the file to
  // `uploadUrl` with the same Content-Type, then calls confirmUpload with `key`.
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int(),
        fileName: z.string().trim().min(1, "No name provided"),
        contentType: z.string(),
        size: z.number().int(),
      }),
    )
    .mutation(async ({ input }) => {
      const error = fileError(input.size, input.contentType);
      if (error) throw badRequest(`${input.fileName} - ${error}`);

      const [patient] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);
      if (!patient) throw badRequest(`Invalid patient ${input.patientId}`);

      return createS3UploadUrl(input.patientId, input.contentType);
    }),

  // Step 2 of an upload: records the file once the browser has uploaded it, after checking
  // what S3 actually holds (the browser controls the bytes it sent). Safe to retry.
  confirmUpload: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int(),
        // Only keys createUploadUrl issues.
        key: z.string().regex(/^patients\/\d+\/[0-9a-f-]{36}$/),
        fileName: z.string().trim().min(1),
        description: z.string().default(""),
      }),
    )
    .mutation(async ({ input }) => {
      // A client can't claim another patient's upload.
      if (!input.key.startsWith(patientKeyPrefix(input.patientId))) {
        throw badRequest("Invalid upload key");
      }

      const uploaded = await getS3ObjectInfo(input.key);
      if (!uploaded)
        throw badRequest(`${input.fileName} - File was not uploaded`);
      const error = fileError(uploaded.size, uploaded.contentType);
      if (error) {
        // It can never be recorded, so remove it.
        await deleteFromS3(input.key).catch(() => {});
        throw badRequest(`${input.fileName} - ${error}`);
      }

      await db
        .insert(files)
        .values({
          patientId: input.patientId,
          s3Key: input.key,
          // Checked by fileError above.
          contentType: uploaded.contentType!,
          fileName: input.fileName,
          description: input.description,
        })
        // A retried confirm leaves the existing row as it is.
        .onConflictDoNothing({ target: files.s3Key });
    }),

  // Rename a file or change its description. The S3 object is untouched; view links
  // pick up the new name.
  update: protectedProcedure
    .input(
      z
        .object({
          id: z.number().int(),
          fileName: z.string().trim().min(1).optional(),
          description: z.string().optional(),
        })
        .refine(
          (d) => d.fileName !== undefined || d.description !== undefined,
          {
            message: "Provide a fileName or description to update",
          },
        ),
    )
    .mutation(async ({ input: { id, ...changes } }) => {
      const [row] = await db
        .update(files)
        .set(changes)
        .where(eq(files.id, id))
        .returning({ id: files.id });
      throwIfMissing(row, id);
    }),

  // Soft delete only: the row is hidden and the S3 object is kept.
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(files)
        .set({ isDeleted: true })
        .where(eq(files.id, input.id))
        .returning({ id: files.id });
      throwIfMissing(row, input.id);
    }),
});
