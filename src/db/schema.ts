import {
  pgTable,
  pgSchema,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  pgEnum,
  integer,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";

// Stub for Supabase-managed auth schema — not migrated, used only for FK references
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// Define enums
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "disposed",
  "donated",
  "expired",
]);
export const referralStateEnum = pgEnum("referral_state", [
  "pending",
  "completed",
  "cancelled",
]);

// Define tables

/*
Village Codes Table:
- id: Primary key, auto-incrementing integer.
- code: Unique code for the village (e.g., "V001").
- name: Name of the village (e.g., "Village A").
- colorHex: Hexadecimal color code for the village (e.g., "#FF5733").
- isVisible: Boolean indicating whether the village code is visible in the application.
- createdAt: Timestamp of when the record was created.
- updatedAt: Timestamp of when the record was last updated.   
*/
export const villageCodes = pgTable("village_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  colorHex: varchar("color_hex", { length: 7 }).notNull(), // maps to 'color_hex' in DB
  isVisible: boolean("is_visible").default(true).notNull(), // maps to 'is_visible' in DB
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type VillageCode = typeof villageCodes.$inferSelect;
export type NewVillageCode = typeof villageCodes.$inferInsert;

/*
Patients Table:
- id: Primary key, auto-incrementing integer.
- villageCodeId: Foreign key referencing the village code.
- name: Name of the patient.
- identificationNumber: Identification number of the patient.
- contactNo: Contact number of the patient.
- gender: Gender of the patient.
- drugAllergy: Drug allergy information of the patient.
- dateOfBirth: Date of birth of the patient.
- hasPoorCard Indicates if the patient has a POOR card or not.
- hasBS2Card: Indicates if the patient has a BS2 card or not.
- hasSabaiCard: Indicates if the patient has a Sabai card or not.
- patientImagePublicId: Cloudinary public ID of the patient's image.
- rekognitionFaceId: Rekognition Face ID for facial recognition.
*/
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  identificationNumber: varchar("identification_number", { length: 255 }),
  contactNo: varchar("contact_no", { length: 255 }),
  gender: genderEnum("gender").notNull(),
  drugAllergy: text("drug_allergy").notNull(),
  dateOfBirth: timestamp("date_of_birth", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  hasPoorCard: boolean("has_poor_card").notNull(),
  hasBS2Card: boolean("has_bs2_card").notNull(),
  hasSabaiCard: boolean("has_sabai_card").notNull(),
  patientImagePublicId: text("patient_image_public_id").notNull(),
  rekognitionFaceId: text("rekognition_face_id"),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

/*
Medication Active Ingredients Table:
- id: Primary key, auto-incrementing integer
- name: Name of the active ingredient (e.g., "Paracetamol 500mg")
- unitOfMeasurement: Unit used for measuring this ingredient (e.g., "bottles", "tablets")
- fallBelow: Threshold quantity that triggers low stock alerts
*/
export const medicationActiveIngredients = pgTable(
  "medication_active_ingredients",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    unitOfMeasurement: varchar("unit_of_measurement", {
      length: 255,
    }).notNull(),
    fallBelow: integer("fall_below").notNull(),
  },
);

export type MedicationActiveIngredient =
  typeof medicationActiveIngredients.$inferSelect;
export type NewMedicationActiveIngredient =
  typeof medicationActiveIngredients.$inferInsert;

/*
Medication Brands Table:
- id: Primary key, auto-incrementing integer
- name: Name of the brand (e.g., "Panadol")
- activeIngredientId: ID of the active ingredient
*/
export const medicationBrands = pgTable("medication_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  activeIngredientId: integer("active_ingredient_id")
    .notNull()
    .references(() => medicationActiveIngredients.id, {
      onDelete: "restrict",
    }),
});

export type MedicationBrand = typeof medicationBrands.$inferSelect;
export type NewMedicationBrand = typeof medicationBrands.$inferInsert;

/*
Medication Stock Table:
- id: Primary key, auto-incrementing integer
- medicationBrandId: ID of the brand
- quantity: Quantity of the medication
- expiry: Expiry date of the medication
- location: Location of the medication
- state: State of the medication (e.g., 'active', 'disposed', 'donated', 'expired')
*/
export const medicationStock = pgTable("medication_stock", {
  id: serial("id").primaryKey(),
  medicationBrandId: integer("medication_brand_id")
    .notNull()
    .references(() => medicationBrands.id, {
      onDelete: "restrict",
    }),
  quantity: integer("quantity").notNull().default(0),
  expiry: timestamp("expiry"),
  location: varchar("location", { length: 255 }),
  stockStatus: medicationStatusEnum("stock_status").default("active"),
});

export type MedicationStock = typeof medicationStock.$inferSelect;
export type NewMedicationStock = typeof medicationStock.$inferInsert;

/*
Visits Table:
- id: Primary key, auto-incrementing integer.
- date: Date and time of the visit.
- patientId: Foreign key referencing the patient.
- villageCodeId: Foreign key referencing the village code.
 */
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  villageCodeId: integer("village_code_id")
    .notNull()
    .references(() => villageCodes.id),
});

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

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
Consults Table:
- id: Primary key, auto-incrementing integer.
- date: Timestamp of the consultation.
- pastMedicalHistory: Patient's past medical history notes.
- consultation: Doctor's consultation notes.
- treatmentPlan: Treatment plan.
- remarks: Additional remarks.
- doctorId: Foreign key referencing the Supabase auth user (doctor).
- visitId: Foreign key referencing the visit.
*/
export const consults = pgTable("consults", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  pastMedicalHistory: text("past_medical_history"),
  consultation: text("consultation"),
  treatmentPlan: text("treatment_plan"),
  remarks: text("remarks"),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => authUsers.id),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visits.id),
});

export type Consult = typeof consults.$inferSelect;
export type NewConsult = typeof consults.$inferInsert;

/*
Diagnosis Table:
- id: Primary key, auto-incrementing integer.
- details: Description of the diagnosis.
- category: Classification of the diagnosis (e.g. "Chronic", "Acute").
- consultId: Foreign key referencing the consult.
*/
export const diagnosis = pgTable("diagnosis", {
  id: serial("id").primaryKey(),
  details: text("details").notNull(),
  category: varchar("category", { length: 255 }),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id),
});

export type Diagnosis = typeof diagnosis.$inferSelect;
export type NewDiagnosis = typeof diagnosis.$inferInsert;

/*
Referrals Table:
- id: Primary key, auto-incrementing integer.
- referredFor: The reason/specialty the patient is referred for (the "why").
- referredTo: The destination the patient is referred to, e.g. hospital/department/provider (the "where").
- referralNotes: Free-text notes about the referral.
- referralState: Lifecycle state of the referral (e.g. 'pending', 'completed', 'cancelled').
- referralOutcome: Free-text result of the referral.
- consultId: Foreign key referencing the consult. Referral cannot be deleted out from under a consult (restrict).
- createdAt: Timestamp of when the referral was created.
*/
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referredFor: text("referred_for").notNull(),
  referredTo: text("referred_to"),
  referralNotes: text("referral_notes"),
  referralState: referralStateEnum("referral_state").default("pending"),
  referralOutcome: text("referral_outcome"),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id, {
      onDelete: "restrict",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

// todo: medication_log table (after users table done)
// todo: medication_review table (after users table done)
