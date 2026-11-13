import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { Button } from "@/components/interactive/Button/Button";
import { usePnMemberOptions } from "@/components/referrals/referralFormOptions";
import { MAX_RIELS, USD_AMOUNT_PATTERN } from "@/server/schemas/referrals";
import { trpc } from "@/utils/trpc";

export type ReferralMoney = {
  id: number;
  // numeric(10, 2) comes back from Postgres as a string, e.g. "12.50".
  amountPaidUsd: string | null;
  amountPaidRiels: number | null;
  memberWhoPaidId: string | null;
};

type MoneyFormValues = {
  amountPaidUsd: string;
  amountPaidRiels: string;
  memberWhoPaidId: string;
};

export const USD_AMOUNT_ERROR = "Enter a USD amount with up to 2 decimals";
export const RIELS_AMOUNT_ERROR = "Enter a whole number of riels";

const isBlank = (value: string) => value.trim() === "";

/**
 * Money section of the referral details accordion: how much was paid, in USD
 * and/or riels, and which PN member paid. Saves only the money fields.
 */
export function ReferralMoneySection({
  referral,
}: {
  referral: ReferralMoney;
}) {
  const pnMemberOptions = usePnMemberOptions(referral.memberWhoPaidId);

  const utils = trpc.useUtils();
  const updateMoney = trpc.referralRouter.updateMoney.useMutation({
    onSuccess: async () => {
      await utils.referralRouter.getById.invalidate({ id: referral.id });
      toast.success("Payment details saved");
    },
    onError: () => toast.error("Failed to save payment details"),
  });

  const methods = useForm<MoneyFormValues>({
    defaultValues: {
      amountPaidUsd: referral.amountPaidUsd ?? "",
      amountPaidRiels: referral.amountPaidRiels?.toString() ?? "",
      memberWhoPaidId: referral.memberWhoPaidId ?? "",
    },
  });

  const onSubmit = (data: MoneyFormValues) => {
    updateMoney.mutate({
      id: referral.id,
      amountPaidUsd: isBlank(data.amountPaidUsd)
        ? null
        : data.amountPaidUsd.trim(),
      amountPaidRiels: isBlank(data.amountPaidRiels)
        ? null
        : Number(data.amountPaidRiels),
      memberWhoPaidId: data.memberWhoPaidId || null,
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6 pt-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <RHFInput
            name="amountPaidUsd"
            label="Amount paid (USD)"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            registerOptions={{
              validate: (value: string) =>
                isBlank(value) ||
                USD_AMOUNT_PATTERN.test(value.trim()) ||
                USD_AMOUNT_ERROR,
            }}
          />
          <RHFInput
            name="amountPaidRiels"
            label="Amount paid (Riels)"
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            placeholder="0"
            registerOptions={{
              validate: (value: string) =>
                isBlank(value) ||
                (/^\d+$/.test(value.trim()) && Number(value) <= MAX_RIELS) ||
                RIELS_AMOUNT_ERROR,
            }}
          />
          <RHFDropdown
            name="memberWhoPaidId"
            label="PN member who paid"
            dropdownOptions={pnMemberOptions}
            placeholder="Select a PN member"
          />
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-44">
            <Button
              type="submit"
              title="Save"
              colour="emerald"
              variant="filled"
              loading={updateMoney.isPending}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
