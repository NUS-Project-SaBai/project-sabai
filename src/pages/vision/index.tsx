import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import { PatientPhoto } from "@/components/PatientPhoto";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import { Button } from "@/components/interactive/Button/Button";

function VisionPage() {
  const router = useRouter();
  const { data: patients, isLoading } = trpc.patientsRouter.list.useQuery();

  const handleUpdateGlasses = (patientId: number) => {
    router.push(`/vision/update-glasses/${patientId}`);
  };

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Vision" }]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vision</h1>
            <p className="mt-2 text-slate-600">
              Manage vision prescriptions and eye care records for all patients.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Loading patients..." />
          ) : patients && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <TableHeader
                  headers={["ID", "Photo", "Full Name", "Actions"]}
                />
                <tbody className="bg-white divide-y divide-slate-200">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {patient.id.toString().padStart(4, "0")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PatientPhoto
                          pictureUrl={patient.patientImageUrl}
                          className="rounded-full border border-slate-200"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {patient.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() =>
                            handleUpdateGlasses(patient.id)
                          }
                          title="Update Glasses"
                          icon={<HiOutlinePencilSquare className="h-4 w-4" />}
                          colour="emerald"
                          variant="filled"
                          size="medium"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No patients found. Add patients to manage their vision records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

VisionPage.getLayout = (page: React.ReactNode) => withDefaultLayout(page);

export default VisionPage;
