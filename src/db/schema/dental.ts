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

import {
  absentPresentNotAssessedValues,
  brushingFrequencyValues,
  cariesValues,
  doneNotDoneValues,
  facialSymmetryValues,
  healthyInflamedBleedingValues,
  malocclusionValues,
  normalLimitedValues,
  oralHygieneValues,
  plaqueValues,
  sugarConsumptionValues,
  yesNoUnknownValues,
} from "@/lib/constants/dental";

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
  extraction: boolean("extraction"),
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
  facialSwelling: boolean("facial_swelling"),
  lymphadenopathy: absentPresentNotAssessedEnum("lymphadenopathy"),
  mouthOpening: normalLimitedEnum("mouth_opening"),

  // Clinical examination: intraoral
  oralHygiene: oralHygieneEnum("oral_hygiene"),
  plaque: plaqueEnum("plaque"),
  calculus: boolean("calculus"),
  gingivalCondition: healthyInflamedBleedingEnum("gingival_condition"),
  caries: cariesEnum("caries"),
  missingTeeth: boolean("missing_teeth"),
  fracturedTeeth: boolean("fractured_teeth"),
  mucosalLesions: boolean("mucosal_lesions"),
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
