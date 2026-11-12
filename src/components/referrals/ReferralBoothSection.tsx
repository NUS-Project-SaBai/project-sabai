import { useId } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import {
  DropdownOption,
  RHFDropdown,
} from "@/components/interactive/RHF/RHFDropdown";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import { Tooltip } from "@/components/interactive/Tooltip";
import type { GuardiansContacted } from "@/lib/constants/referralGuardiansContacted";
import {
  REFERRAL_SERVICE_CLASSES,
  REFERRAL_SERVICE_CLASS_LABELS,
  type ReferralServiceClass,
} from "@/lib/constants/referralServiceClasses";
import { calculateAge } from "@/lib/utils/patient";
import { trpc } from "@/utils/trpc";

const ADULT_AGE = 18;
const PN_TEAM = "PN";

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

// Lets a dropdown be cleared back to "nothing chosen" (saved as null).
const NOT_SELECTED: DropdownOption = { label: "Not selected", value: "" };

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
  const { data: users } = trpc.usersRouter.list.useQuery();

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

  // Same idea for members: PN team only, plus whoever is already saved.
  const pnMemberOptions: DropdownOption[] = [
    NOT_SELECTED,
    ...(users ?? [])
      .filter(
        (u) =>
          u.team?.trim().toUpperCase() === PN_TEAM ||
          u.id === referral.memberInChargeId,
      )
      .map((u) => ({ label: u.name, value: u.id })),
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
    <label
      htmlFor="guardiansContacted"
      className={clsx(
        "inline-flex items-center gap-3 text-sm font-medium",
        isAdult ? "cursor-not-allowed text-slate-400" : "cursor-pointer",
      )}
    >
      <input
        id="guardiansContacted"
        type="checkbox"
        disabled={isAdult}
        aria-describedby={isAdult ? guardiansTooltipId : undefined}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-500 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        {...methods.register("guardiansContacted")}
      />
      Guardians contacted
    </label>
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
