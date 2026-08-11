---
title: Settings
excerpt: Settings Page
permalink: /features/settings/
---

## Introduction

The settings page is where users can configure settings. Currently, clicking 'Settings' on the navigation bar on the left will bring the user straight to the Village Codes page, which is intended as there are no other settings currently.

## Village Codes

The Village Codes page is where users can configure Village Codes used in the application. Each village has:
- Code (Unique)
- Name
- Color
- Status (Visible/Hidden)

### Adding Village Code

Clicking the 'New Village Code' button on the top right of the screen will display a modal where the user can enter the fields to create a new village code.

Navigating away from this page after filling (but not saving) the form will persist its values in the browser's local storage.

Attempting to add a new village code that has the same Code as another village will result in an error. 

### Editing Village Code

Any of these fields may be edited by clicking the 'Edit' button on the corresponding row. Attempting to change a village code to another existing village code will result in an error.

### Deleting Village Code

A Village Code can only be deleted if there are no visits attached to it. Otherwise, there will be an error. 

### Hiding Village Code

Village Codes can be hidden if its status is set to hidden. The checkbox on the upper right corner of the screen is a toggle for the visibility of village codes, and may be useful to hide older villages that the team is not visiting during the trip.

## Upcoming Features

- More informative error messages for non-unique village codes while editing/adding.
