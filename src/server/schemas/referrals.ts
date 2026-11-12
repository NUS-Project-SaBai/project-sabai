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
