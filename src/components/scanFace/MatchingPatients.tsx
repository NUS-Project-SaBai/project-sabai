import { Patient } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import { FaceMatch } from "@aws-sdk/client-rekognition";
import { useEffect, useState } from "react";

export default function MatchingPatients({
  imgDetails,
}: {
  imgDetails: string | null;
}) {
  const matchMutation = trpc.patientsRouter.findFaceMatches.useMutation();
  const matchingPatientsMutation =
    trpc.patientsRouter.listMatchingPatients.useMutation();

  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);

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
          {matchingPatients.map((patient) => (
            <div key={patient.id}>
              <p>{patient.id}</p>
              <p>{patient.name}</p>
              <p>{patient.contactNo}</p>
              <p>{patient.faceEncoding}</p>
            </div>
          ))}
        </div>
      ) : (
        <h1>No matches</h1>
      )}
      Matching for encoding: {imgDetails}
    </>
  );
}
