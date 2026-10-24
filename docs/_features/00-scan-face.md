---
title: Scan Face
excerpt: This page handles the registration of patients by facial recognition.
permalink: /features/scan-face/
---

## Introduction 

The Scan Face page captures the patient's face and is the first step in the clinic process. The page captures patient's faces to register them with the biometrics app for subsequent stations, as well as to check if they have been previously registered before. After leaving the station, the patient should have a visit registered.

## Taking pictures and matching faces 

After a patient's picture is in the camera view, clicking the 'Capture' button at the bottom of the view will take their picture. The button will then turn into a red 'Retake Photo' button.

A loading spinner appears while the application searches for patients matching the current picture taken. 
- If there are no matching patients, the screen shows 'No matches found' and a purple 'Register New Patient' appears on the bottom left corner. Clicking the button displays a registration form on the screen. See [Registering New Patients](#registering-new-patients) for more information. A 'Link Existing Patient' button sits beside it for returning patients the camera did not recognize. See [Linking an existing patient](#linking-an-existing-patient).
- If there are matching patients, the screen shows 'Found matches:' and a table with the matching patients. The table displays the ID, photo, name, and an actions column with a button that creates a visit. 'Link Existing Patient' and 'Register New Patient Instead' appear below the table when the match is the wrong person.

## Registering New Patients 

The registration page contains a registration form and two buttons on the bottom, 'Create New Patient' and 'Match Instead'. The 'Match Instead' button attempts to match the patient's face again. See [Taking pictures and matching faces section](#taking-pictures-and-matching-faces) for more information.

The registration form contains some fields, some of which are compulsory (with '*' on the side).

Fields:
- Name*
- Identification Number*
- Contact Number*
- Gender* (M/F Dropdown)
- Drug Allergy*
- Date of Birth*
- Has POOR Card? (Checkbox, default 'no')
- Has BS2 Card? (Checkbox, default 'no')
- Has Sabai Card? (Checkbox, default 'yes')

Clicking "Create New Patient" with any field missing/without any image captured should display an error.

If all fields are valid, the patient is registered and a visit is also automatically created for them at the time of registration.

## Linking an existing patient

'Link Existing Patient' is for a returning patient whose face was not recognized. It opens a search bar that matches on patient name, patient ID, or identification number.

Patients that match the search are listed with an 'Update face' button. Clicking it replaces that patient's stored photo with the picture just taken and creates a visit for the selected village. The button stays disabled while the save is in progress. A success or error message is shown when it finishes.

If a visit was already created for that patient in the last minute, the page asks for confirmation before creating another.

'Match Instead' returns to the face-match results.
