import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { trpc } from "@/utils/trpc";
import { PatientPhoto } from "@/components/PatientPhoto";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ReactNode } from "react";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Patients" }]}
        />

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function PatientsBasePage() {
  // 1. Fetch data
  const {
    data: patients,
    isLoading,
    isError,
  } = trpc.patientsRouter.list.useQuery();

  if (isError) {
    return (
      <Wrapper>
        <h1 className="text-red-500">An error has occurred!</h1>
      </Wrapper>
    );
  }

  if (isLoading) {
    return (
      <Wrapper>
        <LoadingSpinner message="Loading patients..." />
      </Wrapper>
    );
  }

  if (!patients || patients.length == 0) {
    return (
      <Wrapper>
        <div className="p-12 text-center text-slate-500">
          No patients found. Seed the database or add a new record.
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader
            headers={[
              "ID / Photo",
              "Name",
              "Basic Info",
              "Status Flags",
              "Allergies",
            ]}
          />
          <tbody className="bg-white divide-y divide-slate-200">
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {getPatientIdWithZeroPadding(patient.id, 4) || "No ID"}
                    </span>
                    <PatientPhoto
                      pictureUrl={patient.patientImageUrl}
                      className="rounded-full border border-slate-200"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {patient.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-700 capitalize">
                      {patient.gender} •{" "}
                      {calculateAge(new Date(patient.dateOfBirth))} yrs
                    </span>
                    <span className="text-xs text-slate-500">
                      {patient.contactNo || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-700 max-w-xs truncate">
                    {patient.drugAllergy}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    </Wrapper>
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
