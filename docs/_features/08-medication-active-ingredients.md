---
title: Medication Active Ingredients
excerpt: This page handles viewing, adding, editing, and deleting medication active ingredients.
permalink: /features/medication-active-ingredients/
---

## Introduction

The Medication Active Ingredients page (`/medication-active-ingredients`) can be opened from **Manage Active Ingredients** on the Medication Stock page. It lists ingredients by ID with their name, unit of measurement, fall-below threshold, remarks, and actions.

The fall-below value is used on the Medication Stock page: quantities of **active** stock are summed across brands for the same ingredient. Active stock rows are highlighted when that total is less than or equal to the threshold. Non-active rows are not highlighted by this check.

## Adding Active Ingredients

Click **Add Active Ingredient** to open **Add New Active Ingredient**. The fields start empty when first opened:

- **Name**: text, required by the server; for example, `Paracetamol 500mg`.
- **Unit of Measurement**: text, required by the server; for example, `Pill`.
- **Fall below**: required number. The form requires a value of at least 1, and the server requires a positive integer.
- **Remarks**: optional text.

The form does not mark Name or Unit of Measurement as required locally, but the server rejects empty values. Name and Unit of Measurement are limited to 255 characters by the database. For a fall-below value below 1, the form shows `Please input only positive values.` Saving sends the form to the server; on success the list refreshes, the form resets and the modal closes with `Successfully created!`. A server error shows `An error has occurred.` **Cancel** resets the form and closes the modal. **Close** or Esc closes it without resetting the draft, so the entered values remain when reopened.

## Editing Active Ingredients

Click **Edit** on a row to edit its Name, Unit of Measurement, Fall Below, and Remarks. The ID cannot be edited. The same fall-below and server validation applies as when adding. Click **Save** to submit or **Cancel** to reset the row and exit editing. If the submitted values match the stored values, the page shows `No form field changed!`. A stored null remark is initialised as an empty string in the form, so saving without edits can still be treated as a change. A successful update refreshes the list and shows `Successfully updated!`; an error resets the form and shows `An error has occurred.`

## Deleting Active Ingredients

Click **Delete** to open **Confirm Deletion?**, which displays the ingredient's name, unit, threshold, and remarks. Click **Confirm** to delete it, or **Cancel**, **Close** or Esc to dismiss the modal. Successful deletion refreshes the list and shows `Successfully deleted.` An ingredient referenced by a brand cannot be deleted. On a deletion error, the modal closes and the page shows `Error! Check that there are no brands that depend on this active ingredient.`

## Page States

- While loading, the page shows `Loading active ingredients...`.
- If loading fails, it shows `An error has occurred!`.
- If there are no ingredients, it shows `No active ingredient found. Seed the database or add a new record.` The add button remains available.
