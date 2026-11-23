import { Button } from "@/components/interactive/Button/Button";

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
}

/** A file waiting to be uploaded, with its description. */
export default function SelectedFileRow({
  file,
  description,
  disabled,
  onDescriptionChange,
  onRemove,
}: {
  file: File;
  description: string;
  disabled: boolean;
  onDescriptionChange: (description: string) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all font-medium text-slate-900">{file.name}</p>
          <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
        </div>
        <Button
          colour="red"
          variant="outline"
          size="small"
          title="Remove"
          disabled={disabled}
          onClick={onRemove}
        />
      </div>
      <input
        type="text"
        aria-label={`Description for ${file.name}`}
        placeholder="Add description..."
        value={description}
        disabled={disabled}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
      />
    </li>
  );
}
