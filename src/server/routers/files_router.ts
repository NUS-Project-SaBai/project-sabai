import { z } from "zod";
import { zfd } from "zod-form-data";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { files, patients, type PatientFile } from "@/db/schema";
import {
  deleteDriveFile,
  getDriveViewUrl,
  renameDriveFile,
  uploadToDrive,
} from "@/server/utils/drive";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
} from "@/lib/constants/files";

// "all" returns both deleted and non-deleted files.
const deletedFilterSchema = z.enum(["all", "true", "false"]).default("false");

const isDeletedCondition = (deleted: z.infer<typeof deletedFilterSchema>) =>
  deleted === "all" ? undefined : eq(files.isDeleted, deleted === "true");

/**
 * Adds the Google Drive `fileUrl` the frontend opens to view the file.
 */
const withFileUrl = (file: PatientFile) => ({
  ...file,
  fileUrl: getDriveViewUrl(file.driveFileId),
});

async function getFileOrThrow(id: number) {
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) {
    throw new TRPCError({ code: "NOT_FOUND", message: `File ${id} not found` });
  }
  return file;
}

export const filesRouter = router({
  // List a patient's files, newest first. Non-deleted files only unless `deleted` is set.
  listByPatientId: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int(),
        deleted: deletedFilterSchema,
      }),
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.patientId, input.patientId),
            isDeletedCondition(input.deleted),
          ),
        )
        .orderBy(desc(files.createdAt));
      return rows.map(withFileUrl);
    }),

  // Get a single file by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => withFileUrl(await getFileOrThrow(input.id))),

  // Upload one or more files for a patient. descriptions[i] belongs to files[i].
  upload: protectedProcedure
    .input(
      zfd.formData({
        patientId: zfd.numeric(z.number().int()),
        files: zfd.repeatableOfType(zfd.file()),
        descriptions: zfd.repeatableOfType(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.files.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No file was uploaded",
        });
      }
      if (input.files.length > MAX_FILES_PER_UPLOAD) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time`,
        });
      }
      if (input.files.length !== input.descriptions.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Number of files and descriptions must match",
        });
      }

      const invalidFiles = input.files.flatMap((file) => {
        const errors = [];
        if (file.name.trim() === "") errors.push("No name provided");
        if (file.size > MAX_FILE_SIZE_BYTES) errors.push("File is too large!");
        return errors.map((error) => `${file.name} - ${error}`);
      });
      if (invalidFiles.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid Files:\n${invalidFiles.join("\n")}`,
        });
      }

      const [patient] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);
      if (!patient) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid patient ${input.patientId}`,
        });
      }

      const uploads = await Promise.allSettled(
        input.files.map((file) => uploadToDrive(file, file.name)),
      );
      const driveFileIds = uploads.flatMap((upload) =>
        upload.status === "fulfilled" ? [upload.value] : [],
      );
      // Removes Drive files that won't get a database row, so a failed upload
      // doesn't leave untracked patient documents behind (or duplicates on retry).
      const removeUploaded = () =>
        Promise.allSettled(driveFileIds.map((id) => deleteDriveFile(id)));

      const failed = uploads.find((upload) => upload.status === "rejected");
      if (failed) {
        await removeUploaded();
        throw failed.reason;
      }

      try {
        const created = await db
          .insert(files)
          .values(
            input.files.map((file, i) => ({
              patientId: input.patientId,
              driveFileId: driveFileIds[i],
              fileName: file.name,
              description: input.descriptions[i],
            })),
          )
          .returning();
        return created.map(withFileUrl);
      } catch (error) {
        await removeUploaded();
        throw error;
      }
    }),

  // Update a file's name and/or description. A new name is also applied on Google Drive.
  update: protectedProcedure
    .input(
      z
        .object({
          id: z.number().int(),
          fileName: z.string().trim().min(1).optional(),
          description: z.string().optional(),
        })
        .refine(
          (data) =>
            data.fileName !== undefined || data.description !== undefined,
          { message: "Provide a fileName or description to update" },
        ),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const file = await getFileOrThrow(id);
      if (updateData.fileName && updateData.fileName !== file.fileName) {
        await renameDriveFile(file.driveFileId, updateData.fileName);
      }
      const [result] = await db
        .update(files)
        .set(updateData)
        .where(eq(files.id, id))
        .returning();
      return withFileUrl(result);
    }),

  // Soft delete only: the row is flagged and the Drive file is kept.
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await getFileOrThrow(input.id);
      const [result] = await db
        .update(files)
        .set({ isDeleted: true })
        .where(eq(files.id, input.id))
        .returning();
      return withFileUrl(result);
    }),
});
