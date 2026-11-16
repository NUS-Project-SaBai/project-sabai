---
title: Scan Face
excerpt: Capture a patient's photo to find an existing patient or register a new one.
permalink: /features/scan-face/
---

## Introduction

The Scan Face page is used at the start of the clinic process. It captures a
patient's photo and searches for existing patients with a matching face.

If a matching patient is found, you can create a visit for them. If the patient
is new or the matches are incorrect, you can register them and create their
first visit.

## Taking a photo and finding matches

1. Position the patient in the camera view.
2. Click **Capture** to take a photo.
3. To take another photo, click **Retake Photo**, then click **Capture** again.

After a photo is captured, the application automatically searches for matching
patients. While it searches, it displays **Finding face matches...**.

### No matches

If no patient is found, the page displays **No matches found**. Click
**Register New Patient** to open the registration form.

### Matching patients

If patients are found, the page displays **Found matches:** and a table with
each patient's ID, photo and full name.

To create a visit for a matching patient, click **Create Visit** in their row.
The visit uses the currently selected village code.

If a visit was created for that patient within the last minute, a
**Duplicate Visit** confirmation appears. Click **Confirm** to create another
visit, or **Cancel** to return to the results.

When a visit is created, the page displays **Visit created successfully!**.
If it cannot be created, the page displays
**Failed to create visit. Please try again.**

If none of the results is the correct patient, click
**Register New Patient Instead** to open the registration form.

## Registering a new patient

The registration form uses the photo captured above. Fields marked with **\***
are required.

- Photo*
- Village code* (selected outside the form)
- Name*
- Identification Number*
- Contact Number*
- Gender*
- Drug Allergy*
- Date of Birth*
- Has POOR Card? (optional checkbox, initially unchecked)
- Has BS2 Card? (optional checkbox, initially unchecked)
- Has Sabai Card? (optional checkbox, initially unchecked)

### Child vitals

If the patient's date of birth indicates that they are under 18, the form also
shows optional **Child Vitals** fields:

- **Scoliosis:** Normal or Abnormal
- **Pallor:** Yes or No
- **Pubarche:** Yes or No

If **Pubarche** is set to **Yes**, a **Pubarche Age** field appears. If entered,
the age must be at least 1 and cannot exceed the patient's current age.

### Creating the patient

Click **Create New Patient** after completing the required fields. The
application creates the patient and automatically creates their first visit
using the selected village code.

On success, the page displays **Patient created successfully!**, clears the
photo and resets the form. If creation fails, it displays
**Failed to create patient. Please try again.**

To return to the matching results using the current photo, click
**Match Instead**.

## Upcoming features

Manual selection of an existing patient when facial matching cannot find them
is not yet available from this page.
