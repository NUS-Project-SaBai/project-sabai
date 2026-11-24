import { showBroadcastToast } from "@/components/BroadcastToast";
import { useSession } from "@/lib/context/SessionContext";
import { useBroadcastListener } from "@/lib/hooks/useBroadcastListener";
import { trpc } from "@/utils/trpc";

/**
 * Shows a toast for each live broadcast while a user is signed in, and
 * refreshes the broadcast history so /notifications stays current.
 */
export default function BroadcastListener() {
  const { session } = useSession();
  const utils = trpc.useUtils();

  useBroadcastListener({
    accessToken: session?.access_token ?? null,
    onBroadcast: (broadcast) => {
      showBroadcastToast(broadcast);
      utils.broadcastsRouter.list.invalidate();
    },
  });

  return null;
}
