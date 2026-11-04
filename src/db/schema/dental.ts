import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { visits } from "./patients";

const yesNoUnknownValues = ["yes", "no", "unknown"] as const;
const brushingFrequencyValues = [
  "once",
  "twice",
  "3+ times",
  "occasionally",
  "never",
] as const;
const sugarConsumptionValues = ["low", "moderate", "high"] as const;
const facialSymmetryValues = ["normal", "asymmetrical"] as const;
const absentPresentValues = ["absent", "present"] as const;
const absentPresentNotAssessedValues = [
  "absent",
  "present",
  "not assessed",
] as const;
const normalLimitedValues = ["normal", "limited"] as const;
const oralHygieneValues = ["good", "fair", "poor"] as const;
const plaqueValues = ["none", "mild", "moderate", "heavy"] as const;
const healthyInflamedBleedingValues = [
  "healthy",
  "inflamed",
  "bleeding",
] as const;
const cariesValues = ["absent", "non-cavitated", "cavitated"] as const;
const malocclusionValues = ["not suspected", "suspected"] as const;
const doneNotDoneValues = ["done", "not done"] as const;

export const yesNoUnknownEnum = pgEnum(
  "dental_yes_no_unknown",
  yesNoUnknownValues,
);
export const brushingFrequencyEnum = pgEnum(
  "dental_brushing_frequency",
  brushingFrequencyValues,
);
export const sugarConsumptionEnum = pgEnum(
  "dental_sugar_consumption",
  sugarConsumptionValues,
);
export const facialSymmetryEnum = pgEnum(
  "dental_facial_symmetry",
  facialSymmetryValues,
);
export const absentPresentEnum = pgEnum(
  "dental_absent_present",
  absentPresentValues,
);
export const absentPresentNotAssessedEnum = pgEnum(
  "dental_absent_present_not_assessed",
  absentPresentNotAssessedValues,
);
export const normalLimitedEnum = pgEnum(
  "dental_normal_limited",
  normalLimitedValues,
);
export const oralHygieneEnum = pgEnum("dental_oral_hygiene", oralHygieneValues);
export const plaqueEnum = pgEnum("dental_plaque", plaqueValues);
export const healthyInflamedBleedingEnum = pgEnum(
  "dental_gingival_condition",
  healthyInflamedBleedingValues,
);
export const cariesEnum = pgEnum("dental_caries", cariesValues);
export const malocclusionEnum = pgEnum(
  "dental_malocclusion",
  malocclusionValues,
);
export const doneNotDoneEnum = pgEnum(
  "dental_done_not_done",
  doneNotDoneValues,
);

export const dental = pgTable("dental", {
  id: serial("id").primaryKey(),

  // Dental history
  previousDentalVisit: yesNoUnknownEnum("previous_dental_visit"),
  previousDentalTreatment: yesNoUnknownEnum("previous_dental_treatment"),
  toothache: boolean("toothache"),
  dentalTrauma: boolean("dental_trauma"),
  currentToothache: boolean("current_toothache"),
  toothSensitivity: boolean("tooth_sensitivity"),
  bleedingGums: boolean("bleeding_gums"),
  brushingFrequency: brushingFrequencyEnum("brushing_frequency"),
  fluorideToothpaste: yesNoUnknownEnum("fluoride_toothpaste"),
  sugarConsumption: sugarConsumptionEnum("sugar_consumption"),
  otherDentalHistory: varchar("other_dental_history", { length: 255 }),

  // Chief complaint
  chiefComplaint: varchar("chief_complaint", { length: 255 }),

  // Clinical examination: extraoral
  facialSymmetry: facialSymmetryEnum("facial_symmetry"),
  facialSwelling: absentPresentEnum("facial_swelling"),
  lymphadenopathy: absentPresentNotAssessedEnum("lymphadenopathy"),
  mouthOpening: normalLimitedEnum("mouth_opening"),

  // Clinical examination: intraoral
  oralHygiene: oralHygieneEnum("oral_hygiene"),
  plaque: plaqueEnum("plaque"),
  calculus: absentPresentEnum("calculus"),
  gingivalCondition: healthyInflamedBleedingEnum("gingival_condition"),
  caries: cariesEnum("caries"),
  missingTeeth: absentPresentEnum("missing_teeth"),
  fracturedTeeth: absentPresentEnum("fractured_teeth"),
  mucosalLesions: absentPresentEnum("mucosal_lesions"),
  malocclusion: malocclusionEnum("malocclusion"),

  // Treatment provided (the mockup's date fields are intentionally excluded)
  fluorideStatus: doneNotDoneEnum("fluoride_status"),
  fluorideOperator: varchar("fluoride_operator", { length: 255 }),
  fluorideToothNumber: varchar("fluoride_tooth_number", { length: 255 }),
  sealantStatus: doneNotDoneEnum("sealant_status"),
  sealantOperator: varchar("sealant_operator", { length: 255 }),
  sealantToothNumber: varchar("sealant_tooth_number", { length: 255 }),
  sdfStatus: doneNotDoneEnum("sdf_status"),
  sdfOperator: varchar("sdf_operator", { length: 255 }),
  sdfToothNumber: varchar("sdf_tooth_number", { length: 255 }),
  scalingStatus: doneNotDoneEnum("scaling_status"),
  scalingOperator: varchar("scaling_operator", { length: 255 }),
  scalingToothNumber: varchar("scaling_tooth_number", { length: 255 }),

  // Remarks
  remarks: varchar("remarks", { length: 255 }),

  // Additional fields
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  visitId: integer("visit_id").references(() => visits.id),
});

export type Dental = typeof dental.$inferSelect;
export type NewDental = typeof dental.$inferInsert;
