---
title: Consults
excerpt: This page handles the consults.
permalink: /features/consults/
---

## Introduction

The Consults page is where doctors and medical students record a consultation for a patient. The landing page (`/consults`) lists every patient, and each patient links through to their own consult page (`/consults/{patientId}`) where consults are recorded against a specific visit.

## Patient List

The main Consults page shows a table of all patients with the following columns:
- ID: Patient code with a coloured village indicator when available.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: A 'Start Consult' button that opens the consult page for that patient.

If no patients exist, "No patients found. Add patients to record consults." is shown. If the list fails to load, the page shows "An error has occurred!".

## Recording a Consult

Clicking 'Start Consult' navigates to the patient's consult page. Before a consult can be recorded, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. If the patient has no visits, the page shows "No visits found for this patient. Please create a visit first to record a consult." If there are visits but none is selected, it shows "Please choose a visit to record a consult." Switching visits resets the consult form.

Once a visit is chosen, the read-only reference panel and consult form appear side by side on large screens. On narrower screens, the reference panel appears above the form.

### Visit Summary (reference panel)

The reference panel shows read-only data already recorded for the selected visit, so the clinician can reference it while consulting:

- **Vitals**: Height, Weight, BMI (computed automatically), Blood Pressure, Heart Rate, Temperature, Urine Dip Test, Hemocue Hb Count, Non-Fasting Blood Glucose, Fasting Blood Glucose, HbA1c, Diabetes Mellitus status, and Others. Shows "No vitals recorded for this visit." if there is no vitals record.
- **Vision**: Right/Left Eye degree and Right/Left Eye pinhole. Shows "No vision recorded for this visit." if there is no vision record.

Missing values within an existing record generally display a dash. BMI displays
an explanatory message when height or weight is missing or invalid.

Below the summary, any **previous consults from this visit** are listed as read-only cards, most recent 1st. A visit can accumulate multiple consults (it is an append log), so this shows the history alongside the form.

### Consult Form

The form has the following fields:
- Past Medical History: Free-text
- Consultation: Free-text
- Diagnoses*: One or more diagnoses
- Plan: Free-text
- Remarks: Free-text

Where "*" denotes required. Every other field is optional.

**Diagnoses** are added with the 'Add Diagnosis' button, and each one has:
- Category*: Dropdown (Cardiovascular, Dermatology, Ear Nose Throat, Endocrine, Eye, Gastrointestinal, Haematology, Infectious Diseases, Renal & Genitourinary, Respiratory, Musculoskeletal, Neurology, Obstetrics & Gynaecology, Oral Health, Others)
- Details*: Free-text

At least one diagnosis is required, and each diagnosis must have both a category and details. The form starts with one blank diagnosis. Additional diagnoses can be added; when there is more than one, any diagnosis can be removed with its 'Remove' button. Details must contain non-whitespace text, and a category must be selected.

### Referral

- **Referred for**: Defaults to "Not Referred". The other options are Diagnostic, Acute, Chronic, AdvancedVision [Within clinic], and Others.
- **Referral Notes**: Optional free-text field shown when a referral option other than "Not Referred" is selected.

### Saving

Clicking 'Save Consult' saves the consult and its diagnoses together in a transaction. If validation fails, "Please fill in all required fields before saving." is shown. On success, "Consult has been saved successfully!" appears, the previous-consults list is refreshed, and the form is reset. On failure, "Failed to save consult." is shown.

If a referral was selected, it is created in a separate request **after** the consult has saved and the form has reset. Success shows "Referral submitted!" and failure shows "Failed to create referral." A referral failure does not undo the saved consult. Referral notes are trimmed before submission. Previous consult cards show the date, diagnoses and non-empty consult fields; they do not show referral details.

## Upcoming Features

- Add editing / deleting of saved consults
