import { trpc } from "@/utils/trpc";
import { useEffect } from "react";

export default function MatchingPatients({
  imgDetails,
}: {
  imgDetails: string | null;
}) {
  const matchMutation = trpc.patientsRouter.findFaceMatches.useMutation();

  useEffect(() => {
    matchMutation.mutate(
      { picture: imgDetails! },
      {
        onSuccess(test) {
          console.log("test", test);
        },
        onError(error) {
          console.log(error);
        },
      },
    );
  }, []);

  return (
    <>
      <h1>matching patients placeholder</h1>;{imgDetails && imgDetails}
    </>
  );
}
