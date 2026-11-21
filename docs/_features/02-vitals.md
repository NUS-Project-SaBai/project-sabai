---
title: Vitals
excerpt: This page manages the patient's vitals.
permalink: /features/vitals/
---

## Introduction

The Vitals page lets doctors and medical students record patient's vital signs. The landing page (`/vitals`) lists every patient, and each patient links through to their own vitals form (`/vitals/{id}`) where readings are captured against a specific visit.

## Patient List

The main Vitals page shows a table of all patients with the following columns:
- ID: Patient code with a coloured village indicator when available.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: A 'Vitals' button that opens the vitals form for that patient.

If no patients exist, a "No patients found" message is shown prompting the user to seed the database or add a new record.

If the patient list cannot be loaded, the page displays **An error has occurred!**

## Recording Vitals

Clicking the 'Vitals' button navigates to individual patient's vitals form. Before any readings can be entered, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. 
Vitals are stored per visit — each visit can have at most one vitals record. When loading succeeds, selecting a visit that already has vitals loads the existing values for editing; a visit without a record shows a blank form. A failed vitals lookup can also leave the form blank, so a blank form does not always mean that no record exists.

If there are no visits, the page displays **No visits found for patient.** The
**Edit Patient Details** button opens a separate form to edit the patient.

If the patient lookup fails, the detail page can display **Patient not found**
even when the patient exists. Check the connection before treating this as a
missing record.

### Form Fields

All fields are optional. The form is grouped into sections:

New forms start blank, with neither diabetes history option selected.
Height and temperature use increments of 0.1;
weight, blood glucose, HbA1c and Hemocue use increments of 0.01.
Blood pressure and heart rate use whole numbers.
The form does not enforce physiologically plausible ranges.

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

### Blood pressure flags

When both blood pressure readings are entered, the form displays **HTN** if
systolic is at least 140 mmHg or diastolic is at least 90 mmHg. Otherwise, it
displays **Pre-HTN** if systolic is at least 130 mmHg or diastolic is at least
80 mmHg. No flag is shown below these thresholds or if either reading is missing.

### Growth chart

For patients aged 2 through 18 at the selected visit, the form displays a growth
chart section based on age and gender. Enter both height and weight to plot them: height
is shown in blue and weight in red. The chart requires a height of at least
80 cm and a weight of at least 10 kg.

### Saving

- Clicking 'Save Records' persists the form. 
- Clearing a previously saved text or numeric field and saving removes its value. Once a diabetes history option is selected, the form allows switching between Positive and Negative but does not provide a way to return it to unset.
- If no field has been changed since it was loaded, a "No form field changed!" message is shown and nothing is saved. 
- On success a "Vitals saved successfully!" confirmation appears; on failure a "Failed to save vitals." message is shown. 

The form does not currently display a computed BMI.
