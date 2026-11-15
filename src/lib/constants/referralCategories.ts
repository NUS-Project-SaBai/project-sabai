import type { DropdownOption } from "@/components/interactive/RHF/RHFDropdown";

export const REFERRAL_CATEGORIES = [
  "Not Referred",
  "Diagnostic",
  "Acute",
  "Chronic",
  "AdvancedVision",
  "Others",
] as const;

export type ReferralCategory = (typeof REFERRAL_CATEGORIES)[number];

export const REFERRAL_CATEGORY_OPTIONS: DropdownOption[] =
  REFERRAL_CATEGORIES.map((category) => ({
    label:
      category === "AdvancedVision"
        ? "AdvancedVision [Within clinic]"
        : category,
    value: category,
  }));
