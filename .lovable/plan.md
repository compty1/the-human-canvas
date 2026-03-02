

# Enhance TagBulkEditor with Existing Category Suggestions

## Problem

When bulk-selecting artwork (or other items) and clicking "Set Category," the popover only shows a blank text input. There's no way to see or pick from existing categories already in use, and no clear "create new" flow. You have to remember the exact category name and type it manually.

## Solution

Upgrade the `TagBulkEditor` component so that when `field="category"`, it:

1. **Fetches existing categories** from the target table on open (e.g., all distinct `category` values from `artwork`)
2. **Displays them as clickable chips/buttons** so you can pick one instantly
3. **Keeps the text input** for typing a new category that doesn't exist yet
4. **Shows a "Create new" indicator** when what you've typed doesn't match any existing category

This same improvement will work across all managers that use `set-category` in their bulk actions (artwork, certifications, client work, etc.).

## What Changes

**Single file: `src/components/admin/TagBulkEditor.tsx`**

- Accept an optional `existingOptions` prop (string array) so the parent can pass known categories, OR fetch distinct values from the table automatically when the popover opens
- When `field="category"`:
  - Query `supabase.from(tableName).select("category")` on popover open, extract unique non-null values
  - Render a list of existing categories as clickable buttons above the input
  - Clicking one fills the input immediately (and highlights the selected button)
  - The text input still works for typing a new category
  - If typed text doesn't match any existing category, show a subtle "+ Create new: [typed text]" option
- When `field="tags"`:
  - Similarly fetch existing tags from the table, flatten and deduplicate
  - Show them as suggestion chips below the input that you can click to add
  - Still allows typing new tags manually

## Technical Details

```text
TagBulkEditor (enhanced)
  |-- on popover open: fetch distinct values from tableName for the field
  |-- for "category": render existing as selectable button list + text input for new
  |-- for "tags": render existing as clickable suggestion chips + current add-tag flow
  |-- clicking existing value auto-fills / auto-adds
  |-- typing non-matching text shows "Create new" option
```

The fetch query for categories:
```
supabase.from(tableName).select("category").not("category", "is", null)
```
Then deduplicate in JS. For tags (array column):
```
supabase.from(tableName).select("tags").not("tags", "is", null)
```
Then flatten and deduplicate.

No database changes needed. No new files -- just enhancing the existing `TagBulkEditor.tsx`.

