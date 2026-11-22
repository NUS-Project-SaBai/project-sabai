import { ReactNode } from "react";
import { PatientPhoto } from "@/components/PatientPhoto";

/**
 * Stacked list of patient cards, shown on small screens (e.g mobile) in place of a table.
 * Hidden from the `md` breakpoint up.
 */
export function PatientCardList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-slate-200 md:hidden">{children}</ul>;
}

/**
 * Patient card for use inside PatientCardList: photo on the left, with the patient code,
 * name and any page-specific details or actions stacked on the right.
 * @param pictureUrl - The URL of the patient's photo.
 * @param patientCode - The patient's ID or code, e.g. a PatientCode component.
 * @param name - The patient's name.
 * @param children - Page-specific details and actions shown below the name.
 */
export function PatientCard({
  pictureUrl,
  patientCode,
  name,
  children,
}: {
  pictureUrl: string | null;
  patientCode: ReactNode;
  name: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 p-4">
      <PatientPhoto
        pictureUrl={pictureUrl}
        height={128}
        width={128}
        className="h-32 w-32 max-w-none shrink-0 rounded-lg border border-slate-200 object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="text-xs font-medium text-slate-500">{patientCode}</div>
        <div className="break-words text-sm font-medium text-slate-900">
          {name}
        </div>
        {children}
      </div>
    </li>
  );
}
