export const REFERRAL_SERVICE_CLASSES = [
  "ChronicManagement",
  "ImagingDiagnostics",
  "DefinitiveTreatment",
  "SymptomaticTreatment",
] as const;

export type ReferralServiceClass = (typeof REFERRAL_SERVICE_CLASSES)[number];

export const REFERRAL_SERVICE_CLASS_LABELS: Record<
  ReferralServiceClass,
  string
> = {
  ChronicManagement: "Chronic Management",
  ImagingDiagnostics: "Imaging/Diagnostics",
  DefinitiveTreatment: "Definitive Treatment",
  SymptomaticTreatment: "Symptomatic Treatment",
};
