---
title: Vitals
excerpt: Vitals Page
permalink: /features/vitals/
---

## Introduction

The Vitals page lets doctors and medical students record patient's vital signs. The landing page (`/vitals`) lists every patient, and each patient links through to their own vitals form (`/vitals/{id}`) where readings are captured against a specific visit.

## Patient List

The main Vitals page shows a table of all patients with the following columns:
- ID: Patient code, colour-coded by village.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: A 'Vitals' button that opens the vitals form for that patient.

If no patients exist, a "No patients found" message is shown prompting the user to seed the database or add a new record.

## Recording Vitals

Clicking the 'Vitals' button navigates to individual patient's vitals form. Before any readings can be entered, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. 
Vitals are stored per visit — each visit can have at most one vitals record. Selecting a visit that already has vitals loads the existing values for editing; otherwise a blank form is shown.

### Form Fields

All fields are optional. The form is grouped into sections:

**Body measurements**
- Height (cm): Number
- Weight (kg): Number
- Body Temperature (°C): Number

**Cardiovascular**
- Systolic Blood Pressure (mmHg): Whole number
- Diastolic Blood Pressure (mmHg): Whole number
- Heart Rate (BPM): Whole number

**Metabolic / blood**
- Fasting Blood Glucose (mmol/L): Number
- Non-Fasting Blood Glucose (mmol/L): Number
- HbA1c Level (%): Number
- Hemocue Hemoglobin Count (g/dL): Number
- Diabetes Mellitus History Status Flag: Radio (Positive / Negative)

**Notes**
- Urinalysis Diagnostics (Leukocytes, Nitrites, Protein notes): Free-text
- Additional Clinical Remarks: Free-text

### Saving

- Clicking 'Save Records' persists the form. 
- If no field has been changed since it was loaded, a "No form field changed!" message is shown and nothing is saved. 
- On success a "Vitals saved successfully!" confirmation appears; on failure a "Failed to save vitals." message is shown. 

## Upcoming Features

- Add field-level validation for physiologically plausible ranges (e.g range of values accepted for each fields, flag out abnormal fields)
- Display computed BMI on the form
- Make page more mobile friendly
