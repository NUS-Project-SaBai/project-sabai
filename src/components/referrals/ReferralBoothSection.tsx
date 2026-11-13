import { useId } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  DropdownOption,
  RHFDropdown,
} from "@/components/interactive/RHF/RHFDropdown";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import { Tooltip } from "@/components/interactive/Tooltip";
import { FormCheckbox } from "@/components/referrals/FormCheckbox";
import {
  NOT_SELECTED,
  usePnMemberOptions,
} from "@/components/referrals/referralFormOptions";
import type { GuardiansContacted } from "@/lib/constants/referralGuardiansContacted";
import {
  REFERRAL_SERVICE_CLASSES,
  REFERRAL_SERVICE_CLASS_LABELS,
  type ReferralServiceClass,
} from "@/lib/constants/referralServiceClasses";
import { calculateAge } from "@/lib/utils/patient";
import { trpc } from "@/utils/trpc";

const ADULT_AGE = 18;

export const GUARDIANS_NOT_APPLICABLE_TOOLTIP =
  "Not applicable as the patient is an adult.";

export type ReferralBooth = {
  id: number;
  createdAt: Date;
  patientDateOfBirth: Date;
  referredToId: string | null;
  memberInChargeId: string | null;
  guardiansContacted: GuardiansContacted | null;
  classOfService: ReferralServiceClass | null;
  descriptionOfService: string | null;
  patientSummaryFromScreening: string | null;
  remarksAtBooth: string | null;
};

type BoothFormValues = {
  referredToId: string;
  classOfService: string;
  memberInChargeId: string;
  guardiansContacted: boolean;
  descriptionOfService: string;
  patientSummaryFromScreening: string;
  remarksAtBooth: string;
};

/**
 * Referral booth section of the referral details accordion: where the patient
 * is referred to and what for, who at the booth is in charge, and notes taken
 * at the booth. Saves only the booth fields.
 *
 * Guardians contacted is a checkbox for minors. For adults (age on the day of
 * the referral) it is disabled and saved as NotApplicable.
 */
export function ReferralBoothSection({
  referral,
}: {
  referral: ReferralBooth;
}) {
  const guardiansTooltipId = useId();
  const isAdult =
    calculateAge(referral.patientDateOfBirth, referral.createdAt) >= ADULT_AGE;

  const { data: partners } = trpc.referralPartnersRouter.list.useQuery();
  const pnMemberOptions = usePnMemberOptions(referral.memberInChargeId);

  const utils = trpc.useUtils();
  const updateBooth = trpc.referralRouter.updateBooth.useMutation({
    onSuccess: async () => {
      await utils.referralRouter.getById.invalidate({ id: referral.id });
      toast.success("Referral booth details saved");
    },
    onError: () => toast.error("Failed to save referral booth details"),
  });

  const methods = useForm<BoothFormValues>({
    defaultValues: {
      referredToId: referral.referredToId ?? "",
      classOfService: referral.classOfService ?? "",
      memberInChargeId: referral.memberInChargeId ?? "",
      guardiansContacted: referral.guardiansContacted === "Yes",
      descriptionOfService: referral.descriptionOfService ?? "",
      patientSummaryFromScreening: referral.patientSummaryFromScreening ?? "",
      remarksAtBooth: referral.remarksAtBooth ?? "",
    },
  });

  // Only active partners can be picked, but keep the one already saved on this
  // referral so it still shows if it has since been deactivated.
  const partnerOptions: DropdownOption[] = [
    NOT_SELECTED,
    ...(partners ?? [])
      .filter((p) => p.isActive || p.id === referral.referredToId)
      .map((p) => ({
        label: p.isActive ? p.name : `${p.name} (inactive)`,
        value: p.id,
      })),
  ];

  const serviceClassOptions: DropdownOption[] = [
    NOT_SELECTED,
    ...REFERRAL_SERVICE_CLASSES.map((serviceClass) => ({
      label: REFERRAL_SERVICE_CLASS_LABELS[serviceClass],
      value: serviceClass,
    })),
  ];

  const onSubmit = (data: BoothFormValues) => {
    const guardiansContacted: GuardiansContacted = isAdult
      ? "NotApplicable"
      : data.guardiansContacted
        ? "Yes"
        : "No";

    updateBooth.mutate({
      id: referral.id,
      referredToId: data.referredToId || null,
      memberInChargeId: data.memberInChargeId || null,
      guardiansContacted,
      classOfService: (data.classOfService as ReferralServiceClass) || null,
      descriptionOfService: data.descriptionOfService,
      patientSummaryFromScreening: data.patientSummaryFromScreening,
      remarksAtBooth: data.remarksAtBooth,
    });
  };

  const guardiansCheckbox = (
    <FormCheckbox
      name="guardiansContacted"
      label="Guardians contacted"
      disabled={isAdult}
      describedBy={isAdult ? guardiansTooltipId : undefined}
    />
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-2 pt-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <RHFDropdown
            name="referredToId"
            label="Clinic referred to"
            dropdownOptions={partnerOptions}
            placeholder="Select a clinic"
          />
          <RHFDropdown
            name="classOfService"
            label="Class of service"
            dropdownOptions={serviceClassOptions}
            placeholder="Select a class of service"
          />
          <RHFDropdown
            name="memberInChargeId"
            label="PN member in charge"
            dropdownOptions={pnMemberOptions}
            placeholder="Select a PN member"
          />
          <div className="flex items-end pb-2">
            {isAdult ? (
              <Tooltip
                id={guardiansTooltipId}
                content={GUARDIANS_NOT_APPLICABLE_TOOLTIP}
              >
                {guardiansCheckbox}
              </Tooltip>
            ) : (
              guardiansCheckbox
            )}
          </div>
        </div>

        <div className="pt-2">
          <RHFTextArea
            name="descriptionOfService"
            label="Description of service"
            rows={3}
            placeholder="Describe the service the patient is referred for..."
          />
          <RHFTextArea
            name="patientSummaryFromScreening"
            label="Patient summary from screening"
            rows={3}
            placeholder="Summarise the patient from screening..."
          />
          <RHFTextArea
            name="remarksAtBooth"
            label="Remarks"
            rows={3}
            placeholder="Type any remarks from the booth..."
          />
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-44">
            <Button
              type="submit"
              title="Save"
              colour="emerald"
              variant="filled"
              loading={updateBooth.isPending}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
