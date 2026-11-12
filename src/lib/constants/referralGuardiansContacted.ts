export const GUARDIANS_CONTACTED = ["Yes", "No", "NotApplicable"] as const;

export type GuardiansContacted = (typeof GUARDIANS_CONTACTED)[number];

export const GUARDIANS_CONTACTED_LABELS: Record<GuardiansContacted, string> = {
  Yes: "Yes",
  No: "No",
  NotApplicable: "Not Applicable",
};
