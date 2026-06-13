import { useRouter } from "next/router";
import { FormProvider, useForm, useWatch, useFormContext } from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { vitals } from "@/db/schema";
import { useEffect } from "react";
import { format } from "path";

export default function PatientVitalsPage() {
  const router = useRouter();
  const { id } = router.query;
  const methods = useForm();

  //fetch patient
  const { data: patient, isLoading: patientLoading } =
    trpc.patientsRouter.getById.useQuery(
      { id: Number(id) },
      { enabled: !!id },
    );

  //fetch visits
  const { data: visits, isLoading: visitsLoading } =
    trpc.visitsRouter.getByPatientId.useQuery(
      { patientId: Number(id) },
      { enabled: !!id },
    );

  // Watch the form field to get selected visit (must be before early returns)
  const selectedVisitValue = useWatch({
    control: methods.control,
    name: "visitSelect",
  });

  //Automatically select visit if only got one
  useEffect(() => {
    if(visits && visits.length == 1) {
      methods.setValue("visitSelect", visits[0].id.toString);
    }
  },[visits, methods]);

  // 1. Ensure the router is fully initialized and patientId exists
  if (!router.isReady || patientLoading || visitsLoading) {
    return <LoadingSpinner message="Loading patient and visits..." />;
  }

  // 2. Only check if patient is missing AFTER we are certain the query ran
  if (!patient) {
    return <div className="p-8 text-center font-semibold text-red-500">Patient not found</div>;
  }

  // Only get selected visit when explicitly chosen from dropdown
  const selectedVisit = selectedVisitValue
    ? visits?.find((v) => v.id.toString() === selectedVisitValue)
    : null;

  const formatVisitDate = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
   <div className="min-h-screen flex-1 p-8 bg-slate-50">
      <div className="w-full mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Vitals", href: "/Vitals" },
            { label: `Vitals for - ${patient.name}` },
          ]}
        />

        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Patient Vitals Matrix — {patient.name}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6">

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <FormProvider {...methods}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                {
                  visits && visits.length > 0 ? (
                    <div className="max-w-md">
                      <RHFDropdown
                    name="visitSelect"
                    label="Active Clinical Visit Instance"
                    dropdownOptions={visits.map((visit) => ({
                      label: formatVisitDate(visit.date),
                      value: visit.id.toString(),
                    }))}
                  />
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                      No visits found for patient.
                    </div>
                  )  
                }
              </div>

              <div className="p-6">
                {selectedVisit ? (
                <div className="mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                    Filling up vitals form for visit on {formatVisitDate(selectedVisit.date)}
                    </span> 

                    <VitalsForm visitId={selectedVisit.id} />
                  </div>
                    ) : (
                  visits && visits.length > 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                      Please choose a visit to view vitals.
                    </div>
                  )
                )}
              </div>

            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}


function VitalsForm({ visitId }: {visitId:number}) {

  const { data: vitals, isLoading: vitalsLoading } =
    trpc.vitalsRouter.getByVisitId.useQuery(
      { visitId: visitId },
      { enabled: !!visitId },
    );

  if (vitalsLoading) return <LoadingSpinner message="Loading Vitals" />;

  return <div>Vitals Form inputs goes here</div>;
}

PatientVitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );

//dropdown listing all the visits of that patient by id
//on selecting that particular visit, get the vitals of that visit
//show the vitals in a from
//special cases: no visits found -> create a visit? Need to clarify route, for now just show that no visit found
//special case only one visit found -> auto display for that
