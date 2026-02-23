import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { PatientPhoto } from "@/components/PatientPhoto";
import { withDefaultLayout } from "@/components/layouts/SidebarLayout";
import PatientDetailSkeleton from "@/components/PatientDetailSkeleton";
import { calculateAge } from "@/lib/utils/patient";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function PatientPage() {
  const router = useRouter();

  const patientId = useMemo(() => {
    const { id } = router.query;
    if (typeof id !== "string") {
      return null;
    }

    const parsedId = Number.parseInt(id, 10);
    return Number.isNaN(parsedId) ? null : parsedId;
  }, [router.query]);

  const {
    data: patient,
    isLoading,
    isRefetching,
  } = trpc.patientsRouter.getById.useQuery(
    { id: patientId ?? 0 },
    { enabled: !!patientId },
  );

  if (!router.isReady || !patientId || isLoading || isRefetching) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex-1 p-8">
        <div className="w-full mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Patient not found
            </h1>
            <p className="text-slate-600">
              No patient exists for ID: {patientId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const details = [
    { label: "ID", value: patient.id.toString() },
    { label: "Name", value: patient.name },
    {
      label: "Identification Number",
      value: patient.identificationNumber || "-",
    },
    { label: "Contact Number", value: patient.contactNo || "-" },
    { label: "Gender", value: patient.gender },
    {
      label: "Date of Birth",
      value: new Date(patient.dateOfBirth).toLocaleDateString(),
    },
    { label: "Age", value: `${calculateAge(patient.dateOfBirth)} years` },
    { label: "Drug Allergy", value: patient.drugAllergy },
    { label: "POOR", value: patient.poor },
    { label: "BS2", value: patient.bs2 },
    { label: "Sabai Card", value: patient.sabaiCard },
    { label: "Patient Image URL", value: patient.patientImageUrl },
  ];

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <PatientPhoto
              pictureUrl={patient.patientImageUrl}
              height={64}
              width={64}
              className="h-16 w-16 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {patient.name}
              </h1>
              <p className="text-slate-600">Simple patient profile details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="rounded-lg border border-slate-200 p-3"
              >
                <p className="text-xs font-medium text-slate-500 mb-1">
                  {detail.label}
                </p>
                <p className="text-sm text-slate-900 wrap-break-word">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

PatientPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(<PatientTopMenuLayout>{page}</PatientTopMenuLayout>);
