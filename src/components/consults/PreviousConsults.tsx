import clsx from "clsx";
import toast from "react-hot-toast";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatVisitDate } from "@/lib/utils/visit";
import type { ConsultWithDiagnoses } from "@/types/consults";
import { CONSULT_EDIT_WINDOW_MS } from "@/lib/constants/consults";

function isEditable(consult: ConsultWithDiagnoses): boolean {
  return (
    Date.now() - new Date(consult.date).getTime() <= CONSULT_EDIT_WINDOW_MS
  );
}

/**
 * A single labelled block of read-only consult text. Renders nothing when the
 * value is empty so blank optional fields don't clutter the card.
 */
function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
}

type ConsultCardProps = {
  consult: ConsultWithDiagnoses;
  editingId: number | null;
  onEdit: (consult: ConsultWithDiagnoses) => void;
};

/**
 * A read-only card for one saved consult: its date, notes, and diagnoses.
 * Shows an Edit button that is disabled (with a toast explanation) once the
 * 24-hour edit window has passed.
 */
function ConsultCard({ consult, editingId, onEdit }: ConsultCardProps) {
  const editable = isEditable(consult);
  const isBeingEdited = editingId === consult.id;

  const handleEditClick = () => {
    if (!editable) {
      toast.error(
        "This consult can no longer be edited (24-hour window has passed).",
      );
      return;
    }
    onEdit(consult);
  };

  return (
    <article
      className={clsx(
        "space-y-3 rounded-lg border p-4",
        isBeingEdited ? "border-emerald-400" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">
          {formatVisitDate(consult.date)}
        </p>
        <button
          type="button"
          onClick={handleEditClick}
          title={editable ? "Edit consult" : "Edit window has passed"}
          className={clsx(
            "inline-flex items-center gap-1 rounded p-1 text-sm transition",
            editable
              ? "cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              : "cursor-not-allowed text-slate-300",
          )}
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          Edit
        </button>
      </div>

      <Field label="Past Medical History" value={consult.pastMedicalHistory} />
      <Field label="Consultation" value={consult.consultation} />

      {consult.diagnoses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Diagnoses
          </p>
          <ul className="mt-1 space-y-1">
            {consult.diagnoses.map((d) => (
              <li key={d.id} className="break-words text-sm text-slate-700">
                <span className="font-medium">{d.category ?? "-"}:</span>{" "}
                {d.details}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Plan" value={consult.treatmentPlan} />
      <Field label="Remarks" value={consult.remarks} />
    </article>
  );
}

type PreviousConsultsProps = {
  visitId: number;
  editingId: number | null;
  onEdit: (consult: ConsultWithDiagnoses) => void;
};

/**
 * Read-only list of previously-saved consults for a visit, most recent first.
 * A visit can accumulate multiple consults (append log), so this shows the
 * history alongside the form for recording a new one.
 */
export function PreviousConsults({
  visitId,
  editingId,
  onEdit,
}: PreviousConsultsProps) {
  const { data: consults, isLoading } =
    trpc.consultsRouter.getByVisitId.useQuery({ visitId });

  if (isLoading) {
    return (
      <LoadingSpinner message="Loading previous consults..." className="p-6" />
    );
  }

  if (!consults || consults.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 space-y-4 border-t border-slate-200 pt-8">
      <h2 className="text-sm font-semibold text-slate-700">
        Previous consults from this visit ({consults.length})
      </h2>
      <div className="space-y-4">
        {consults.map((consult) => (
          <ConsultCard
            key={consult.id}
            consult={consult}
            editingId={editingId}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}
