import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import ModalToast from "@/components/interactive/ModalToast";
import { Button } from "@/components/interactive/Button/Button";
import { getFileError } from "@/lib/utils/files";
import FileDropzone from "./FileDropzone";
import SelectedFileRow from "./SelectedFileRow";
import { useUploadPatientFiles } from "./useUploadPatientFiles";

type SelectedFile = { file: File; description: string };

const isSameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** Picks files with descriptions and uploads them. Failed files stay in the list to retry. */
export default function UploadDocumentsModal({
  patientId,
  onClose,
}: {
  patientId: number;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadFiles = useUploadPatientFiles(patientId);

  // Rejects invalid files before they reach S3, and skips files already in the list.
  const addFiles = (files: FileList) => {
    const valid = Array.from(files).filter((file) => {
      const error = getFileError(file.size, file.type);
      if (error) toast.error(`${file.name} - ${error}`, { toasterId: "modal" });
      return !error;
    });
    setSelected((prev) => [
      ...prev,
      ...valid
        .filter((file) => !prev.some((p) => isSameFile(p.file, file)))
        .map((file) => ({ file, description: "" })),
    ]);
  };

  const updateDescription = (index: number, description: string) =>
    setSelected((prev) =>
      prev.map((item, i) => (i === index ? { ...item, description } : item)),
    );

  const removeFile = (index: number) =>
    setSelected((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    setIsUploading(true);
    const failures = await uploadFiles(selected);
    setIsUploading(false);

    if (failures.length === 0) {
      const count = selected.length;
      toast.success(`Uploaded ${count} file${count === 1 ? "" : "s"}`);
      onClose();
      return;
    }

    // Keep only the failed files so they can be retried.
    setSelected(failures.map(({ item }) => item));
    const lines = failures.map(({ message }) => message).join("\n");
    toast.error(`Failed to upload:\n${lines}`, { toasterId: "modal" });
  };

  return (
    <Modal
      title="Upload Document"
      // Closing mid-upload would hide any failure message.
      onClose={() => !isUploading && onClose()}
      maxWidthClassName="max-w-2xl"
    >
      <ModalToast />
      <div className="flex flex-col gap-4">
        {selected.length > 0 && (
          <ul className="flex max-h-[50vh] flex-col divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
            {selected.map((item, index) => (
              <SelectedFileRow
                // Unique, since the same file can't be added twice.
                key={`${item.file.name}-${item.file.size}-${item.file.lastModified}`}
                file={item.file}
                description={item.description}
                disabled={isUploading}
                onDescriptionChange={(text) => updateDescription(index, text)}
                onRemove={() => removeFile(index)}
              />
            ))}
          </ul>
        )}

        <FileDropzone onFiles={addFiles} disabled={isUploading} />

        <Button
          colour="emerald"
          title={isUploading ? "Uploading..." : "Upload"}
          loading={isUploading}
          disabled={selected.length === 0}
          onClick={handleUpload}
          className="w-full"
        />
      </div>
    </Modal>
  );
}
