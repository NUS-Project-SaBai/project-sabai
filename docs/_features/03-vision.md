---
title: Vision
excerpt: This page manages the patient's vision, including basic vision tests and glasses fitting.
permalink: /features/vision/
---

## Introduction

The Vision page manages vision prescriptions and eye care records for patients. The landing page (`/vision`) lists every patient, and each patient links through to their own glasses form (`/vision/update-glasses/{patientId}`) where eyesight data is recorded against a specific visit.

## Patient List

The main Vision page shows every patient with the following details:
- ID: Patient code, colour-coded by village.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: An 'Update Glasses' button that opens the glasses form for that patient.

The list is responsive — it renders as a full table on tablet and desktop, and as stacked cards on mobile. If no patients exist, a "No patients found. Add patients to manage their vision records." message is shown.

## Updating Glasses

Clicking 'Update Glasses' navigates to the patient's glasses form. Before any eyesight data can be entered, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. If the patient has no visits, a message is shown prompting the user to create a visit first.

Eyesight is stored per visit — each visit can have one eyesight record. Selecting a visit that already has data loads the existing values for editing; otherwise a blank form is shown.

### Form Fields

All fields are optional. The form is grouped into sections, each with a left and right eye value:

**Visual Acuity (Degree)**
- Left Eye Degree: Free-text
- Right Eye Degree: Free-text

**Pinhole**
- Left Eye Pinhole: Free-text
- Right Eye Pinhole: Free-text

**Astigmatism**
- Left Astigmatism: Free-text
- Right Astigmatism: Free-text

**Prescribed Glasses (Degree)**
- Left Prescribed Glasses Degree: Free-text
- Right Prescribed Glasses Degree: Free-text

**Comments**
- Comments: Free-text

### Saving

Clicking 'Save Records' persists the form. If no field has been changed since it was loaded, a "No form field changed!" message is shown and nothing is saved. On success a "Vision record saved successfully!" confirmation appears; on failure a "Failed to save vision record." message is shown. 

## Upcoming Features

- Add field-level validation for prescription values
- Add editing / deleting of saved vision records
