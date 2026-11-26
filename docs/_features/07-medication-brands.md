---
title: Medication Brands
excerpt: This page displays medication brands and their associated active ingredient IDs.
permalink: /features/medication-brands/
---

## Introduction

The Medication Brands page (`/medication-brands`) can be opened from **Manage Brands** on the Medication Stock page. It displays each brand's Brand ID, Name, Remarks, and Active Ingredient ID. The ID refers to an existing active ingredient; the table does not display its name.

The page is currently read-only: it has no controls to add, edit, or delete brands. Although the empty-state message mentions adding a record, this page does not provide an add form.

## Page States

- While loading, the page shows `Loading brands...`.
- If loading fails, it shows `An error has occurred!`.
- If there are no brands, it shows `No medication brands found. Seed the database or add a new record.`
