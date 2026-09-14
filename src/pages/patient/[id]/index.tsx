import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { PatientPhoto } from "@/components/PatientPhoto";
import PatientDetailSkeleton from "@/components/PatientDetailSkeleton";
import { calculateAge } from "@/lib/utils/patient";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import { useState } from "react";
import Modal from "@/components/interactive/Modal";
import EditPatientForm from "@/components/patient/EditPatientForm";
import { Button } from "@/components/interactive/Button/Button";

function parsePatientId(id: string | string[] | undefined) {
  if (typeof id !== "string") {
    return null;
  }

  const parsedId = Number.parseInt(id, 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}

export default function PatientPage() {
  const router = useRouter();
  const patientId = parsePatientId(router.query.id);
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  const {
    data: patient,
    isLoading,
    isRefetching,
  } = trpc.patientsRouter.getById.useQuery(
    { id: patientId ?? 0 },
    { enabled: !!patientId },
  );

  const { data: visits, isLoading: visitsLoading } =
    trpc.visitsRouter.getByPatientId.useQuery(
      { patientId: patientId ?? 0 },
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
    { label: "POOR", value: patient.hasPoorCard },
    { label: "BS2", value: patient.hasBS2Card },
    { label: "Sabai Card", value: patient.hasSabaiCard },
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
              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                {patient.name}
              </h1>
              <p className="text-slate-600">Simple patient profile details</p>
            </div>
            <Button
              title="Edit Patient Details"
              colour="indigo"
              onClick={() => setIsEditingPatient(true)}
              className="shrink-0"
            />
          </div>

          {isEditingPatient && (
            <Modal
              title="Edit Patient Details"
              onClose={() => setIsEditingPatient(false)}
            >
              <EditPatientForm
                patient={patient}
                onSuccess={() => setIsEditingPatient(false)}
              />
            </Modal>
          )}

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

        {/* Visits Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-2">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Visit History
          </h2>

          {visitsLoading ? (
            <div className="text-center py-4">
              <p className="text-slate-500">Loading visits...</p>
            </div>
          ) : !visits || visits.length === 0 ? (
            <p className="text-slate-500 py-4">
              No visits recorded for this patient.
            </p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit, index) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: visit.villageCodeColor }}
                      title={`Village: ${visit.villageCodeName}`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        Visit #{visits.length - index}
                      </p>
                      <p className="text-sm text-slate-600">
                        {visit.villageCodeName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(visit.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(visit.date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PatientPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(<PatientTopMenuLayout>{page}</PatientTopMenuLayout>);
