---
title: Medication Stock
excerpt: This page handles viewing, adding, editing, and splitting medication stock.
permalink: /features/medication-stock/
---

## Introduction

The Medication Stock page lists non-zero stock records in descending stock ID order, with active ingredient, brand, location, quantity, expiry, state, and remarks. An active stock row is highlighted when the total active quantity across all brands of its active ingredient is at or below that ingredient's configured low-stock threshold. Non-active rows do not receive this highlight.

Use **Manage Brands** and **Manage Active Ingredients** to open the respective configuration pages. If there are no stock records to display, the page says `No stock found. Seed the database or add a new record.` A loading failure displays `An error has occurred!`.

## Adding Medication Stock

Click **Add Stock** to open **Add New Stock**. The form starts empty; fields marked * are required.

- **Location***: Free text.
- **Quantity***: Number, at least 1; stock quantities must be integers. Values below 1 display `Please input only positive values.`
- **Expiry Date***: Date picker.
- **Brand + Active Ingredient***: Select a configured brand, displayed as `Active Ingredient (Brand)`.
- **Status***: Select `active`, `discarded`, `donated`, `dispensed`, or `reserved`.
- **Remarks**: Optional free text.

Missing required fields display `Missing [field label]!`, for example `Missing Location!` or `Missing Status!`. If the brand options fail to load, the form displays `An error has occurred while loading the dropdown options for brand + active ingredient. Please refresh the page.`

Click **Save** to create the record, or **Cancel** to discard the form. A successful save displays `Successfully created!` and closes the modal. A failed save displays `An error has occurred.`

## Editing Medication Stock

Click **Edit** on a row to edit its location, state, and remarks inline. Location is required; state uses the same five status options as the add form. Active ingredient, brand, quantity, and expiry cannot be edited here. Clearing remarks removes the stored remark; saved remarks are trimmed of surrounding whitespace.

Click **Save** to apply changes or **Cancel** to discard them. Saving without changing a field displays `No fields changed!`. A successful update displays `Successfully updated!`; a failed update displays `An error has occurred while updating the stock. Refresh and try again.`

## Splitting Medication Stock

Click **Split** on a row to open **Split Stock**. The modal shows the parent stock details. Click **Add Split** to add each child; each starts with the parent's location, status, quantity, and remarks. Edit those fields as needed, and use the `-` button to remove a child. Each child inherits the parent's brand and expiry. Child location is required, quantity must be a positive integer, and remarks are optional.

Create between 2 and 10 children. Their quantities must add up to the parent quantity, and no two children may have identical location, status, quantity, and remarks. At 10 children, **Add Split** is disabled and `Maximum of 10 splits reached!` is displayed. Click **Confirm** to split; closing the modal discards the unsaved children. The following messages appear for validation errors:

- No children: `Submitting without a split does nothing!`
- One child: `Please use the editing function instead to edit a single split!`
- Quantities do not add up: `Child stock quantity does not equal parent stock quantity!`
- Duplicate children: `Splits are not distinct!`

On success, `Successfully split!` is displayed. The parent quantity becomes zero and the parent disappears from the list; the new child records appear instead. If the parent no longer exists, the server reports `Parent stock item not found.` If it has already been split, it reports `The parent stock has already split.` Other server errors are also displayed in the split notification.
