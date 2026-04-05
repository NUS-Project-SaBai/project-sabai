import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { PatientPhoto } from "@/components/PatientPhoto";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";

function PatientsBasePage() {
  // 1. Fetch data
  const { data: patients, isLoading } = trpc.patientsRouter.list.useQuery();

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        {/* Navigation / Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Home
          </Link>
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-slate-900 font-medium">Patients</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
            <p className="mt-2 text-slate-600">
              Manage patient records and medical information.
            </p>
          </div>
          {/* Placeholder for future "Add Patient" button */}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <svg
                className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading patients...
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID / Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Basic Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status Flags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Allergies
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {getPatientIdWithZeroPadding(patient.id, 4) ||
                              "No ID"}
                          </span>
                          <PatientPhoto
                            pictureUrl={patient.patientImageUrl}
                            className="rounded-full border border-slate-200"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-700 capitalize">
                            {patient.gender} •{" "}
                            {calculateAge(new Date(patient.dateOfBirth))} yrs
                          </span>
                          <span className="text-xs text-slate-500">
                            {patient.contactNo || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Badge
                            label="Poor"
                            active={patient.hasPoorCard}
                            color="orange"
                          />
                          <Badge
                            label="BS2"
                            active={patient.hasBS2Card}
                            color="blue"
                          />
                          <Badge
                            label="Sabai"
                            active={patient.hasSabaiCard}
                            color="green"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 max-w-xs truncate">
                          {patient.drugAllergy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No patients found. Seed the database or add a new record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components & functions
function Badge({
  label,
  active,
  color,
}: {
  label: string;
  active: boolean;
  color: "blue" | "green" | "orange";
}) {
  if (!active) return null;

  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[color]}`}
    >
      {label}
    </span>
  );
}

function calculateAge(birthDate: Date) {
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getPatientIdWithZeroPadding(id: number, padLength: number) {
  return id.toString().padStart(padLength, "0");
}

PatientsBasePage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(<PatientTopMenuLayout>{page}</PatientTopMenuLayout>);

export default PatientsBasePage;
