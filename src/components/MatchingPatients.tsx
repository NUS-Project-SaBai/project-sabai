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
          console.log(test);
          const matches: FaceMatch[] = test.data!;
          matchingPatientsMutation.mutate(
            { matches: matches },
            {
              onSuccess(result) {
                console.log(result);
              },
              onError(err) {
                console.error(err);
              },
            },
          );
        },
        onError(error) {
          console.log(error);
        },
      },
    );
  }, []);

  return (
    <>
      {matchingPatients.length > 0 ? (
        <h1>Found matches</h1>
      ) : (
        <h1>No matches</h1>
      )}
      Matching for encoding: {imgDetails}
    </>
  );
}
