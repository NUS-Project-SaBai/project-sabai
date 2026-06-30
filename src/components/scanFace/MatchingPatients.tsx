import { Patient } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import { FaceMatch } from "@aws-sdk/client-rekognition";
import { useEffect, useState } from "react";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { Mode } from "@/types/scan";

type PatientWithImage = Patient & {
  patientImageUrl: string | null;
};

export default function MatchingPatients({
  imgDetails,
  setMode,
}: {
  imgDetails: string | null;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}) {
  const findFaceMatchMutation = trpc.patientsRouter.findFaceMatches.useMutation(
    {
      onSuccess(response) {
        const matches: FaceMatch[] = response.data!;
        findMatchingPatientsMutation.mutate({ matches: matches });
      },
      onError(error) {
        console.error(error);
        toast.error("Error: Unable to find matching face.");
      },
    },
  );
  const findMatchingPatientsMutation =
    trpc.patientsRouter.listMatchingPatients.useMutation({
      onSuccess(result) {
        setMatchingPatients(result);
      },
      onError(err) {
        console.error(err);
        toast.error("Error: Unable to find matching patients.");
      },
    });

  const [matchingPatients, setMatchingPatients] = useState<PatientWithImage[]>(
    [],
  );

  useEffect(() => {
    findFaceMatchMutation.mutate({ picture: imgDetails! });
  }, []);

  if (findFaceMatchMutation.isPending) {
    return (
      <LoadingSpinner message="Finding face matches..." className="p-12" />
    );
  }

  if (findMatchingPatientsMutation.isPending) {
    return (
      <LoadingSpinner message="Finding matching patients..." className="p-12" />
    );
  }

  if (matchingPatients.length === 0) {
    return (
      <div className="flex-col">
        <h2 className="text-xl font-bold mb-4 text-center py-10">
          No matches found
        </h2>
        <button
          onClick={() => setMode(Mode.REGISTERING)}
          className="flex-1 px-4 py-2 rounded-lg font-medium bg-indigo-700 text-white"
        >
          Register New Patient
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Found matches:</h2>
      <table className="min-w-full divide-y divide-slate-200">
        <TableHeader headers={["ID", "Photo", "Full Name", "Actions"]} />
        <tbody className="bg-white divide-y divide-slate-200">
          {matchingPatients.map((patient) => (
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
        <button
          onClick={() => setMode(Mode.REGISTERING)}
          className="flex-1 px-4 py-2 rounded-lg font-medium bg-indigo-700 text-white"
        >
          Register New Patient Instead
        </button>
      </div>
    </div>
  );
}
