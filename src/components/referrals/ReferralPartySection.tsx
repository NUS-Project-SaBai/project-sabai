import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import { FormCheckbox } from "@/components/referrals/FormCheckbox";
import { usePnMemberOptions } from "@/components/referrals/referralFormOptions";
import { trpc } from "@/utils/trpc";

export type ReferralParty = {
  id: number;
  memberOnRunId: string | null;
  presentAtReferralParty: boolean;
  referralPartyResults: string | null;
  followUp: boolean;
  doctorsUpdated: boolean;
};

type PartyFormValues = {
  memberOnRunId: string;
  presentAtReferralParty: boolean;
  referralPartyResults: string;
  followUp: boolean;
  doctorsUpdated: boolean;
};

/**
 * Referral party section of the referral details accordion: who from PN was
 * on the run, whether the patient turned up, the results, and the follow-up
 * checks. Saves only the party fields.
 */
export function ReferralPartySection({
  referral,
}: {
  referral: ReferralParty;
}) {
  const pnMemberOptions = usePnMemberOptions(referral.memberOnRunId);

  const utils = trpc.useUtils();
  const updateParty = trpc.referralRouter.updateParty.useMutation({
    onSuccess: async () => {
      await utils.referralRouter.getById.invalidate({ id: referral.id });
      toast.success("Referral party details saved");
    },
    onError: () => toast.error("Failed to save referral party details"),
  });

  const methods = useForm<PartyFormValues>({
    defaultValues: {
      memberOnRunId: referral.memberOnRunId ?? "",
      presentAtReferralParty: referral.presentAtReferralParty,
      referralPartyResults: referral.referralPartyResults ?? "",
      followUp: referral.followUp,
      doctorsUpdated: referral.doctorsUpdated,
    },
  });

  const onSubmit = (data: PartyFormValues) => {
    updateParty.mutate({
      id: referral.id,
      memberOnRunId: data.memberOnRunId || null,
      presentAtReferralParty: data.presentAtReferralParty,
      referralPartyResults: data.referralPartyResults,
      followUp: data.followUp,
      doctorsUpdated: data.doctorsUpdated,
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-2 pt-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <RHFDropdown
            name="memberOnRunId"
            label="PN member on run"
            dropdownOptions={pnMemberOptions}
            placeholder="Select a PN member"
          />
          <div className="flex items-end pb-2">
            <FormCheckbox
              name="presentAtReferralParty"
              label="Present at referral party"
            />
          </div>
        </div>

        <div className="pt-2">
          <RHFTextArea
            name="referralPartyResults"
            label="Referral party results"
            rows={4}
            placeholder="Type the results from the referral party..."
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <FormCheckbox name="followUp" label="Follow up" />
          <FormCheckbox name="doctorsUpdated" label="Doctors updated" />
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-44">
            <Button
              type="submit"
              title="Save"
              colour="emerald"
              variant="filled"
              loading={updateParty.isPending}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
