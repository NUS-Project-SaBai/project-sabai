import { Patient } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import { FaceMatch } from "@aws-sdk/client-rekognition";
import { useEffect, useState } from "react";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { PatientPhoto } from "@/components/PatientPhoto";

type PatientWithImage = Patient & {
  patientImageUrl: string | null;
};

export default function MatchingPatients({
  imgDetails,
}: {
  imgDetails: string | null;
}) {
  const matchMutation = trpc.patientsRouter.findFaceMatches.useMutation();
  const matchingPatientsMutation =
    trpc.patientsRouter.listMatchingPatients.useMutation();

  const [matchingPatients, setMatchingPatients] = useState<PatientWithImage[]>(
    [],
  );

  useEffect(() => {
    matchMutation.mutate(
      { picture: imgDetails! },
      {
        onSuccess(test) {
          const matches: FaceMatch[] = test.data!;
          matchingPatientsMutation.mutate(
            { matches: matches },
            {
              onSuccess(result) {
                setMatchingPatients(result);
              },
              onError(err) {
                console.error(err);
              },
            },
          );
        },
        onError(error) {
          console.error(error);
        },
      },
    );
  }, []);

  return (
    <>
      {matchingPatients.length > 0 ? (
        <div>
          <h1>Found matches</h1>
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
                  <TableCell>test</TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <h1>No matches</h1>
      )}
    </>
  );
}
