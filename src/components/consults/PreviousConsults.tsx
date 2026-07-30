import { trpc, RouterOutput } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatVisitDate } from "@/lib/utils/visit";

type Consult = RouterOutput["consultsRouter"]["getByVisitId"][number];

/**
 * A single labelled block of read-only consult text. Renders nothing when the
 * value is empty so blank optional fields don't clutter the card.
 */
function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
}

/**
 * A read-only card for one saved consult: its date, notes, and diagnoses.
 */
function ConsultCard({ consult }: { consult: Consult }) {
  return (
    <article className="space-y-3 rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400">
        {formatVisitDate(consult.date)}
      </p>
      <Field label="Past Medical History" value={consult.pastMedicalHistory} />
      <Field label="Consultation" value={consult.consultation} />

      {consult.diagnoses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500">Diagnoses</p>
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

/**
 * Read-only list of previously-saved consults for a visit, most recent first.
 * A visit can accumulate multiple consults (append log), so this shows the
 * history alongside the form for recording a new one.
 */
export function PreviousConsults({ visitId }: { visitId: number }) {
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
          <ConsultCard key={consult.id} consult={consult} />
        ))}
      </div>
    </section>
  );
}
