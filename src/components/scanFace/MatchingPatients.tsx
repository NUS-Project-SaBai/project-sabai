import { trpc } from "@/utils/trpc";
import { useEffect } from "react";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Mode } from "@/types/scan";
import { Button } from "@/components/interactive/Button/Button";

export default function MatchingPatients({
  imgDetails,
  setMode,
}: {
  imgDetails: string;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}) {
  const searchPatientsByPictureQuery =
    trpc.patientsRouter.searchPatientsByPicture.useMutation();
  useEffect(() => {
    searchPatientsByPictureQuery.mutate({ picture: imgDetails });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgDetails]); // suppress warning about missing dependencies because we only want to run this effect when imgDetails changes

  if (searchPatientsByPictureQuery.isError) {
    return (
      <div className="flex-col">
        <h2 className="text-xl font-bold mb-4 text-center py-10">
          The server encountered an error while trying to find matches. Please
          try again later.
        </h2>
      </div>
    );
  }

  if (searchPatientsByPictureQuery.isIdle) {
    return (
      <div className="flex-col">
        <h2 className="text-xl font-bold mb-4 text-center py-10">
          Enter a face image to find matching patients.
        </h2>
      </div>
    );
  }

  if (searchPatientsByPictureQuery.isPending) {
    return (
      <LoadingSpinner message="Finding face matches..." className="p-12" />
    );
  }

  if (searchPatientsByPictureQuery.data.length === 0) {
    return (
      <div className="flex-col">
        <h2 className="text-xl font-bold mb-4 text-center py-10">
          No matches found
        </h2>
        <Button
          onClick={() => setMode(Mode.REGISTERING)}
          colour="indigo"
          title="Register New Patient"
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Found matches:</h2>
      <table className="min-w-full divide-y divide-slate-200">
        <TableHeader headers={["ID", "Photo", "Full Name", "Actions"]} />
        <tbody className="bg-white divide-y divide-slate-200">
          {searchPatientsByPictureQuery.data.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <div className="text-sm font-medium text-slate-900">
                  {patient.id.toString().padStart(4, "0")}
                </div>
              </TableCell>
              <TableCell>
                <PatientPhoto
                  pictureUrl={patient.patientImageUrl}
                  className="rounded-full border border-slate-200"
                />
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-slate-900">
                  {patient.name}
                </div>
              </TableCell>
              <TableCell>
                {/* Placeholder for 'create new visit' button */}
                Create visit
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 mt-6">
        <Button
          colour="indigo"
          onClick={() => setMode(Mode.REGISTERING)}
          title="Register New Patient Instead"
        />
      </div>
    </div>
  );
}
