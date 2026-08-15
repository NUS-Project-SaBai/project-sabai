---
title: Consults
excerpt: This page handles the consults.
permalink: /features/consults/
---

## Introduction

The Consults page is where doctors and medical students record a consultation for a patient. The landing page (`/consults`) lists every patient, and each patient links through to their own consult page (`/consults/{patientId}`) where consults are recorded against a specific visit.

## Patient List

The main Consults page shows a table of all patients with the following columns:
- ID: Patient code, colour-coded by village.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: A 'Start Consult' button that opens the consult page for that patient.

If no patients exist, a "No patients found. Add patients to record consults." message is shown.

## Recording a Consult

Clicking 'Start Consult' navigates to the patient's consult page. Before a consult can be recorded, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. If the patient has no visits, a message is shown prompting the user to create a visit first.

Once a visit is chosen, the page splits into two halves: a read-only reference panel on the left, and the consult form on the right.

### Visit Summary (reference panel)

The left panel shows read-only data already recorded for the selected visit, so the clinician can reference it while consulting:

- **Vitals**: Height, Weight, BMI (computed automatically), Blood Pressure, Heart Rate, Temperature, Urine Dip Test, Hemocue Hb Count, Non-Fasting Blood Glucose, Fasting Blood Glucose, HbA1c, and Diabetes Mellitus status. Shows "No vitals recorded for this visit." if empty.
- **Vision**: Right/Left Eye degree and Right/Left Eye pinhole. Shows "No vision recorded for this visit." if empty.

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

At least one diagnosis is required, and each diagnosis must have both a category and details. Additional diagnoses can be added, and any diagnosis beyond the 1st can be removed with its 'Remove' button.

### Saving

Clicking 'Save Consult' persists the consult and all of its diagnoses together in a single transaction — if anything fails, nothing is saved. If required fields are missing, a "Please fill in all required fields before saving." message is shown. On success a "Consult has been saved successfully!" confirmation appears, the new consult is added to the previous-consults list, and the form is cleared for the next entry. On failure a "Failed to save consult." message is shown.

## Upcoming Features

- Make page more mobile friendly (Usually doctors would use this on desktop, however let's try to make this responsive and friendly to other viewports)
- Add editing / deleting of saved consults
