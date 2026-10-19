import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";
import {
  REFERRAL_STATES,
  type ReferralState,
} from "@/lib/constants/referralStates";

/**
 * Status dropdown for a referral. Saves on change and refreshes the referral
 * list and detail queries so every view shows the new status.
 */
export function ReferralStateDropdown({
  referralId,
  referralState,
}: {
  referralId: number;
  referralState: ReferralState;
}) {
  const utils = trpc.useUtils();
  const updateState = trpc.referralRouter.updateState.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.referralRouter.list.invalidate(),
        utils.referralRouter.getById.invalidate({ id: referralId }),
      ]);
      toast.success("Referral status updated");
    },
    onError: () => toast.error("Failed to update referral status"),
  });

  return (
    <label className="block">
      <span className="sr-only">Referral status</span>
      <select
        value={referralState}
        disabled={updateState.isPending}
        onChange={(e) =>
          updateState.mutate({
            id: referralId,
            referralState: e.target.value as ReferralState,
          })
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-500"
      >
        {REFERRAL_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </label>
  );
}
