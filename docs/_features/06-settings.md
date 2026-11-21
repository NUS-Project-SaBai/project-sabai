---
title: Settings
excerpt: Configure village codes for the clinic deployment.
permalink: /features/settings/
---

## Introduction

The Settings navigation item opens `/settings`, which currently offers a **Village Codes** card. Select it to open `/settings/village-codes`.

## Village Codes

The table displays Code, Name, Color, Status and actions. Status is shown as **Active** or **Hidden**. Hidden codes are excluded by default; select **Show Hidden** to include them in the table. Each row has **Edit** and **Delete** actions.

If the village-code query fails, the table can appear empty without a specific
error message. The village selector can also display **No villages available**
when it cannot load codes, so that message does not always mean no codes exist.

### Adding a Village Code

Click **New Village Code** to open the form:

- **Code**: Required text; must be unique.
- **Name**: Required text.
- **Color**: Color picker with a read-only hex value. The default is `#3b82f6` (blue) when there is no saved draft.
- **Is Visible?**: Checkbox, checked by default when there is no saved draft. Unchecking it makes the code hidden.

Hidden codes are also removed from the village selector used for new patients
and visits. If the selected code becomes hidden, the selection is cleared.

Click **Save** to create the code or **Cancel** to close the modal. The new-code form is saved in browser local storage after a one-second debounce, so an unsaved draft can be restored when the form is reopened. A successful creation clears the draft and shows "Village code created!". Duplicate codes show "Another village already has this code." Other creation failures show "Unable to create village code."

### Editing a Village Code

Click **Edit** on a row, change its fields and click **Save**, or click **Cancel** to close the modal. Edits start with the selected code's values and are not saved as a new-code draft. Saving without changes shows "Fields not changed!". A successful update shows "Village code updated!"; a duplicate code shows "Another village already has this code." Other update failures show "Unable to update village code."

The form requires Code and Name. The create API also requires non-empty Code and Name, and validates Color as a three- or six-digit hex color prefixed with `#`.

### Deleting a Village Code

Click **Delete** on a row to open **Confirm Deletion**, which shows its Code and Name. Click **Confirm** to delete it or **Cancel** to close the modal. Success shows "Village code deleted!". A failure shows "Unable to delete village code. Check that there are no visits with this village code before deleting." A code referenced by a visit cannot be deleted; the same message is also used for other deletion failures.
