import clsx from "clsx";
import Modal from "@/components/interactive/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { trpc, type RouterOutput } from "@/utils/trpc";

type PatientDocument = RouterOutput["filesRouter"]["listByPatientId"][number];

function formatUploadedAt(createdAt: PatientDocument["createdAt"]) {
  return new Date(createdAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function DocumentRow({ doc }: { doc: PatientDocument }) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open document in new tab"
          className="break-all text-indigo-600 underline"
        >
          {doc.fileName}
        </a>
        <p
          className={clsx(
            "text-sm",
            doc.description ? "text-slate-600" : "italic text-slate-400",
          )}
        >
          {doc.description || "No description"}
        </p>
      </div>
      <p className="shrink-0 text-sm text-slate-500">
        {formatUploadedAt(doc.createdAt)}
      </p>
    </li>
  );
}

function DocumentList({ patientId }: { patientId: number }) {
  // Refetched on every open, since view links expire after an hour.
  const {
    data: documents,
    isLoading,
    isError,
  } = trpc.filesRouter.listByPatientId.useQuery(
    { patientId },
    { refetchOnMount: "always" },
  );

  if (isLoading) return <LoadingSpinner message="Loading documents..." />;

  if (isError) {
    return (
      <p className="py-4 text-center text-red-700">Could not load documents.</p>
    );
  }

  if (!documents?.length) {
    return (
      <p className="py-4 text-center text-slate-500">No documents found.</p>
    );
  }

  return (
    <ul className="flex max-h-[60vh] flex-col divide-y divide-slate-100 overflow-y-auto">
      {documents.map((doc) => (
        <DocumentRow key={doc.id} doc={doc} />
      ))}
    </ul>
  );
}

/** Lists a patient's documents, each linking to the file in a new tab. */
export default function ViewDocumentsModal({
  patientId,
  onClose,
}: {
  patientId: number;
  onClose: () => void;
}) {
  return (
    <Modal
      title="View Documents"
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
    >
      <DocumentList patientId={patientId} />
    </Modal>
  );
}
