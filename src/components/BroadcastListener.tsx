import { showBroadcastToast } from "@/components/BroadcastToast";
import { useSession } from "@/lib/context/SessionContext";
import { useBroadcastListener } from "@/lib/hooks/useBroadcastListener";

/** Shows a toast for each live broadcast while a user is signed in. */
export default function BroadcastListener() {
  const { session } = useSession();

  useBroadcastListener({
    accessToken: session?.access_token ?? null,
    onBroadcast: showBroadcastToast,
  });

  return null;
}
