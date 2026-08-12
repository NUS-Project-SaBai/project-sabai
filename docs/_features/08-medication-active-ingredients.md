---
title: Medication Active Ingredients
excerpt: Medication Active Ingredients Page
permalink: /features/medication-active-ingredients/
---

## Introduction

The Medication Active Ingredients page allows users to create, read, update and delete active ingredients. Each active ingredients have these fields:
- Name: The name of the active ingredient
- Unit of Measurement: How the medicine can be counted. Examples include bottles/pills.
- Fall below: The number at which the user will be notified when the stocks involving this active ingredient falls below. For example, if 2 batches of stock uses the same active ingredient, they will both contribute to the same amount of the fall below. This mechanism is still a work in progress.
- Remarks: Remarks

## Adding Active Ingredients

Users can click on the button on the top-left corner of the screen to add an active ingredient. Upon clicking the button, a modal will be displayed, prompting the user to key in the following fields:
- Name (text, example: Paracetamol 500mg)
- Unit of Measurement (text, example: Pill)
- Fall below (number, example: 5000)
- Remarks (text, optional)

## Editing Active Ingredients

When the 'Edit' button in a row is clicked, the fields will change into editable cells, where the user can click on and modify the text. The Edit button changes to a 'Save' button to save the changes that the user made to the row.

## Deleting Active Ingredients

When the 'Delete' button in a row is clicked, a confirmation modal will display on the screen. When confirmed, the active ingredient will then be deleted. Note that deletion will fail if there are any brands associated with the active ingredient.

## Upcoming Features

- Better handling for invalid inputs
- Notify on fall below (turn the row red, or show some kind of indication)

