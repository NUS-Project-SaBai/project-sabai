import {
  pgTable,
  serial,
  boolean,
  text,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

import { visits } from "./schema";

/*
Vitals Table:
- id: Primary key, auto-incrementing integer.
- height: Patient height in cm (numeric with 2 decimal places).
- weight: Patient weight in kg (numeric with 2 decimal places).
- temperature: Body temperature in Celsius (numeric with 2 decimal places).
- systolic: Systolic blood pressure (integer).
- diastolic: Diastolic blood pressure (integer).
- heart_rate: Heart rate measurement in beats per minute (integer).
- hemocue_count: Hemocue count measurement (numeric with 2 decimal places).
- diabetes_mellitus: Diabetes mellitus presence (boolean).
- urine_test: Urine test results.
- blood_glucose_non_fasting: Non-fasting blood glucose level (numeric with 2 decimal places).
- blood_glucose_fasting: Fasting blood glucose level (numeric with 2 decimal places).
- hba1c: HbA1c level (numeric with 2 decimal places).
- others: Additional notes or observations.
- visit_id: Foreign key referencing the visit (unique).
*/
export const vitals = pgTable("vitals", {
  id: serial("id").primaryKey(),
  height: numeric("height", { precision: 5, scale: 2 }),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  temperature: numeric("temperature", { precision: 4, scale: 2 }),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  heartRate: integer("heart_rate"),
  hemocueCount: numeric("hemocue_count", { precision: 5, scale: 2 }),
  diabetesMellitus: boolean("diabetes_mellitus"),
  urineTest: text("urine_test"),
  bloodGlucoseNonFasting: numeric("blood_glucose_non_fasting", {
    precision: 5,
    scale: 2,
  }),
  bloodGlucoseFasting: numeric("blood_glucose_fasting", {
    precision: 5,
    scale: 2,
  }),
  hba1c: numeric("hba1c", { precision: 5, scale: 2 }),
  others: text("others"),
  visitId: integer("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, {
      onDelete: "cascade",
    }),
});

export type Vital = typeof vitals.$inferSelect;
export type NewVital = typeof vitals.$inferInsert;

/*
Eyesight Table:
- id: Primary key, auto-incrementing integer.
- visit_id: Foreign key referencing the visit (unique).
- left_eye_degree: Left eye vision degree measurement.
- right_eye_degree: Right eye vision degree measurement.
- left_eye_pinhole: Left eye pinhole test result.
- right_eye_pinhole: Right eye pinhole test result.
- left_astigmatism: Left eye astigmatism measurement.
- right_astigmatism: Right eye astigmatism measurement.
- comments: Additional comments or observations.
- left_prescribed_glasses_degree: Prescribed glasses degree for the left eye.
- right_prescribed_glasses_degree: Prescribed glasses degree for the right eye.
*/
export const eyesight = pgTable("eyesight", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, {
      onDelete: "cascade",
    }),
  leftEyeDegree: text("left_eye_degree"),
  rightEyeDegree: text("right_eye_degree"),
  leftEyePinhole: text("left_eye_pinhole"),
  rightEyePinhole: text("right_eye_pinhole"),
  leftAstigmatism: text("left_astigmatism"),
  rightAstigmatism: text("right_astigmatism"),
  comments: text("comments"),
  leftPrescribedGlassesDegree: text("left_prescribed_glasses_degree"),
  rightPrescribedGlassesDegree: text("right_prescribed_glasses_degree"),
});

export type Eyesight = typeof eyesight.$inferSelect;
export type NewEyesight = typeof eyesight.$inferInsert;

/*
Puberty Table:
- id: Primary key, auto-incrementing integer.
- pubarche: Whether pubarche has occurred (nullable = not assessed).
- pubarcheAge: Age at pubarche in years.
- thelarche: Whether thelarche has occurred.
- thelarcheAge: Age at thelarche in years.
- menarche: Whether menarche has occurred.
- menarcheAge: Age at menarche in years.
- voiceChange: Whether voice change has occurred.
- voiceChangeAge: Age at voice change in years.
- testicularGrowth: Whether testicular growth has occurred.
- testicularGrowthAge: Age at testicular growth in years.
- additionalNotes: Additional notes or observations.
- vitalId: Foreign key referencing the vitals record (unique).
*/
export const puberty = pgTable("puberty", {
  id: serial("id").primaryKey(),
  pubarche: boolean("pubarche"),
  pubarcheAge: integer("pubarche_age"),
  thelarche: boolean("thelarche"),
  thelarcheAge: integer("thelarche_age"),
  menarche: boolean("menarche"),
  menarcheAge: integer("menarche_age"),
  voiceChange: boolean("voice_change"),
  voiceChangeAge: integer("voice_change_age"),
  testicularGrowth: boolean("testicular_growth"),
  testicularGrowthAge: integer("testicular_growth_age"),
  additionalNotes: text("additional_notes"),
  vitalId: integer("vital_id")
    .notNull()
    .unique()
    .references(() => vitals.id, {
      onDelete: "cascade",
    }),
});

export type Puberty = typeof puberty.$inferSelect;
export type NewPuberty = typeof puberty.$inferInsert;

/*
Child Vitals Table:
- id: Primary key, auto-incrementing integer.
- grossMotor: Gross motor assessment.
- redReflex: Red reflex test result.
- scoliosis: Scoliosis assessment.
- pallor: Presence of pallor (nullable = not assessed).
- oralCavity: Oral cavity assessment.
- heart: Heart examination findings.
- abdomen: Abdomen examination findings.
- lungs: Lungs examination findings.
- hernialOrifices: Hernial orifices examination findings.
- vitalId: Foreign key referencing the vitals record (unique).
*/
export const childVitals = pgTable("child_vitals", {
  id: serial("id").primaryKey(),
  grossMotor: text("gross_motor"),
  redReflex: text("red_reflex"),
  scoliosis: text("scoliosis"),
  pallor: boolean("pallor"),
  oralCavity: text("oral_cavity"),
  heart: text("heart"),
  abdomen: text("abdomen"),
  lungs: text("lungs"),
  hernialOrifices: text("hernial_orifices"),
  vitalId: integer("vital_id")
    .notNull()
    .unique()
    .references(() => vitals.id, {
      onDelete: "cascade",
    }),
});

export type ChildVital = typeof childVitals.$inferSelect;
export type NewChildVital = typeof childVitals.$inferInsert;
