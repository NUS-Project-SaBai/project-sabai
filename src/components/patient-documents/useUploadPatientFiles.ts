import { trpc } from "@/utils/trpc";

type FileToUpload = { file: File; description: string };

export type UploadFailure<T> = { item: T; message: string };

// "a.pdf - reason". Server messages often already start with the file name.
function failureMessage(file: File, reason: unknown) {
  const message = reason instanceof Error ? reason.message : "Upload failed";
  return message.startsWith(file.name) ? message : `${file.name} - ${message}`;
}

/**
 * Uploads files for a patient and refreshes the patient's document list. Each file uploads on
 * its own, so one failure doesn't stop the rest; resolves with the files that failed.
 */
export function useUploadPatientFiles(patientId: number) {
  const createUploadUrl = trpc.filesRouter.createUploadUrl.useMutation();
  const confirmUpload = trpc.filesRouter.confirmUpload.useMutation();
  const utils = trpc.useUtils();

  // Get a presigned S3 form, POST the file to S3, then record it.
  const uploadOne = async ({ file, description }: FileToUpload) => {
    const { key, url, fields } = await createUploadUrl.mutateAsync({
      patientId,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });

    // S3 requires every policy field before the file.
    const form = new FormData();
    Object.entries(fields).forEach(([name, value]) => form.append(name, value));
    form.append("file", file);
    const response = await fetch(url, { method: "POST", body: form });
    if (!response.ok) throw new Error(`S3 responded ${response.status}`);

    await confirmUpload.mutateAsync({
      patientId,
      key,
      fileName: file.name,
      description: description.trim(),
    });
  };

  return async <T extends FileToUpload>(
    items: T[],
  ): Promise<UploadFailure<T>[]> => {
    const results = await Promise.allSettled(items.map(uploadOne));

    const failures: UploadFailure<T>[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") return;
      console.error(result.reason);
      failures.push({
        item: items[i],
        message: failureMessage(items[i].file, result.reason),
      });
    });

    if (failures.length < items.length) {
      utils.filesRouter.listByPatientId.invalidate({ patientId });
    }
    return failures;
  };
}
