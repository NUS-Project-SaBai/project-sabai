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

In matching mode, capturing a photo automatically searches for matching
patients. While it searches, the page displays **Finding face matches...**.
If you retake a photo while registering, the page stays in registration mode
and does not search automatically. Click **Match Instead** to search using the
current photo.

If the search request fails, the page displays **The server encountered an
error while trying to find matches. Please try again later.** A face-matching
service error can also be returned as an empty result, so **No matches found**
does not necessarily mean that the search succeeded.

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
visit, or **Cancel** to return to the results. If the duplicate check fails,
the page proceeds with visit creation without displaying the confirmation.

When a visit is created, the page displays **Visit created successfully!**.
If it cannot be created, the page displays
**Failed to create visit. Please try again.**

If none of the results is the correct patient, click
**Register New Patient Instead** to open the registration form.

## Registering a new patient

The registration form uses the photo captured above. The photo, village code
and fields marked with **\*** are required. Select the village using the
**Village for new patients & visits** selector outside the form.

- Photo*
- Village code (selected outside the form)
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
shows **Child Vitals** fields:

- **Scoliosis:** Normal or Abnormal
- **Pallor:** Yes or No
- **Pubarche:** Yes or No

The child fields are not marked required, but currently leaving Scoliosis
unselected can cause registration to fail. Select **Normal** or **Abnormal**
before submitting. The form currently submits an unselected Pallor or Pubarche
as **No**, so select the intended values explicitly.

If **Pubarche** is set to **Yes**, a **Pubarche Age** field appears. If entered,
the age must be at least 1 and cannot exceed the patient's current age.

### Creating the patient

Click **Create New Patient** after completing the required fields. The
application creates the patient and automatically creates their first visit
using the selected village code.

If no photo or village code is available when the form is submitted, the page
displays **Please capture a face image before submitting.** or **Please select
a village code before submitting.**, respectively.

On success, the page displays **Patient created successfully!**, clears the
photo and resets the form. If creation fails, it displays
**Failed to create patient. Please try again.** Patient and visit creation are
not one transaction, so check whether a patient or visit was created before
retrying after an error.

To search again using the current photo, click
**Match Instead**.

## Upcoming features

Manual selection of an existing patient when facial matching cannot find them
is not yet available from this page.
