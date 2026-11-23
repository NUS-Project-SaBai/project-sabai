import { useEffect, useState } from "react";
import clsx from "clsx";
import { ALLOWED_FILE_TYPES } from "@/lib/constants/files";

/** A drop zone that also opens the file picker when clicked. */
export default function FileDropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: FileList) => void;
  disabled: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  // A file dropped outside the zone would open in the tab and lose anything unsaved on the
  // page (e.g. a consult form), so ignore stray drops while the zone is on screen.
  useEffect(() => {
    const ignore = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", ignore);
    window.addEventListener("drop", ignore);
    return () => {
      window.removeEventListener("dragover", ignore);
      window.removeEventListener("drop", ignore);
    };
  }, []);

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) onFiles(e.dataTransfer.files);
      }}
      className={clsx(
        "rounded-lg border-2 border-dashed p-4 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-400",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : isDragging
            ? "cursor-pointer border-indigo-400 bg-indigo-50"
            : "cursor-pointer border-slate-300 bg-slate-50 hover:bg-slate-100",
      )}
    >
      <input
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          // Lets the same file be picked again after it's removed.
          e.target.value = "";
        }}
      />
      <p className="text-slate-600">
        Drag and drop files here, or click to select files
      </p>
      <p className="mt-1 text-sm text-slate-500">
        PDF, JPEG, PNG or DOCX, up to 25 MB each
      </p>
    </label>
  );
}
