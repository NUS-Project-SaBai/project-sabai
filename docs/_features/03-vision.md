---
title: Vision
excerpt: Record vision test results and prescribed glasses degrees.
permalink: /features/vision/
---

## Introduction

The Vision page manages vision prescriptions and eye care records for patients. The landing page (`/vision`) lists every patient, and each patient links through to their own vision form (`/vision/update-vision/{patientId}`) where eyesight data is recorded against a specific visit.

## Patient List

The main Vision page shows every patient with the following details:
- ID: Patient code with a coloured village indicator when available.
- Photo: Patient's photo.
- Name: Patient's name.
- Actions: An 'Update Vision' button that opens the vision form for that patient.

The list is responsive — it renders as a full table on tablet and desktop, and as stacked cards on mobile. If no patients exist, a "No patients found. Add patients to manage their vision records." message is shown.

If the patient list cannot be loaded, the page displays **An error has occurred!**

## Updating Vision

Clicking 'Update Vision' navigates to the patient's vision form. Before any eyesight data can be entered, a visit must be selected:

- **Choose visit**: A dropdown listing the patient's visits by date. If the patient has only one visit, it is selected automatically. If the patient has no visits, a message is shown prompting the user to create a visit first.

Eyesight is stored per visit — each visit can have one eyesight record. When loading succeeds, selecting a visit that already has data loads the existing values for editing; a visit without a record shows a blank form. A failed eyesight lookup can also leave the form blank, so a blank form does not always mean that no record exists.

If the patient lookup fails, the detail page can display **Patient not found**
even when the patient exists. Check the connection before treating this as a
missing record.

### Form Fields

All fields are optional. The eye measurement sections have left and right values; Comments is shared:

**Visual Acuity (Degree)**
- Left Eye Degree: Visual acuity notation
- Right Eye Degree: Visual acuity notation

**Pinhole**
- Left Eye Pinhole: Visual acuity notation or NI
- Right Eye Pinhole: Visual acuity notation or NI

**Astigmatism**
- Left Astigmatism: Free-text
- Right Astigmatism: Free-text

**Prescribed Glasses (Degree)**
- Left Prescribed Glasses Degree: Free-text
- Right Prescribed Glasses Degree: Free-text

**Comments**
- Comments: Free-text

### Validation

Visual acuity and pinhole values may be left blank. If entered, they must use
one of these formats:

- `6/6`, `6/7.5`, `6/9`, `6/12`, `6/15`, `6/18`, `6/24`, `6/36`, `6/60` or `6/120`.
- One of those fractions followed by `+` or `-` and one or two digits, such as `6/9+2` or `6/9-2`.
- `CF`, `HM`, `LP` or `NLP`. Pinhole fields also accept `NI` (no improvement).

Letter codes are case-insensitive and saved in uppercase. Invalid acuity or
pinhole values display an inline error and prevent saving. Astigmatism,
prescribed glasses degree and comments are free-text fields.

### Saving

Clicking 'Save Records' persists the form. If no field has been changed since it was loaded, a "No form field changed!" message is shown and nothing is saved. On success a "Vision record saved successfully!" confirmation appears; on failure a "Failed to save vision record." message is shown. 

Existing values can be edited by selecting their visit and saving the changes.
Currently, clearing a previously saved field does not remove its stored value;
the existing value may reappear after saving.

The page does not provide a button to delete a vision record.
