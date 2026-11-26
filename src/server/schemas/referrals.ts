import { z } from "zod";
import { GUARDIANS_CONTACTED } from "@/lib/constants/referralGuardiansContacted";
import { REFERRAL_SERVICE_CLASSES } from "@/lib/constants/referralServiceClasses";

// Blank text is stored as NULL. Always sending a value means an update can clear it.
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null);

// Fields filled in at the referral booth. Every field is sent on save, and
// null clears it.
export const updateReferralBoothInput = z.object({
  id: z.number().int(),
  referredToId: z.uuid().nullable(),
  memberInChargeId: z.uuid().nullable(),
  guardiansContacted: z.enum(GUARDIANS_CONTACTED).nullable(),
  classOfService: z.enum(REFERRAL_SERVICE_CLASSES).nullable(),
  descriptionOfService: optionalText,
  patientSummaryFromScreening: optionalText,
  remarksAtBooth: optionalText,
});

export type UpdateReferralBoothInput = z.input<typeof updateReferralBoothInput>;

// Fields filled in at the referral party. Every field is sent on save.
export const updateReferralPartyInput = z.object({
  id: z.number().int(),
  memberOnRunId: z.uuid().nullable(),
  presentAtReferralParty: z.boolean(),
  referralPartyResults: optionalText,
  followUp: z.boolean(),
  doctorsUpdated: z.boolean(),
});

export type UpdateReferralPartyInput = z.input<typeof updateReferralPartyInput>;

// numeric(10, 2): up to 8 digits before the point and 2 after.
export const USD_AMOUNT_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;
// Riels have no subunit, and the column is a Postgres integer.
export const MAX_RIELS = 2_147_483_647;

// Money section: how much was paid and who paid it. Every field is sent on
// save, and null clears it.
export const updateReferralMoneyInput = z.object({
  id: z.number().int(),
  // String, not number, so the amount reaches the numeric column exactly.
  amountPaidUsd: z
    .string()
    .trim()
    .regex(USD_AMOUNT_PATTERN, "Enter a USD amount with up to 2 decimals")
    .nullable(),
  amountPaidRiels: z.number().int().min(0).max(MAX_RIELS).nullable(),
  memberWhoPaidId: z.uuid().nullable(),
});

export type UpdateReferralMoneyInput = z.input<typeof updateReferralMoneyInput>;
