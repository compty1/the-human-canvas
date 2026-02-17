

# Plan: Fix Add-to-Content Flow, Add Drag-Reorder, and Add Similarity Sorting

## Issue 1: Add to Content -- Fix the Flow

**Problem**: When selecting a content type with multiple image fields (like Experiments), the modal forces you to pick a "Target Field" before showing existing records. This is confusing -- users want to pick the record first, then choose which field to add images to.

Additionally, some content types may not show all records (e.g., only published ones). All existing records should be shown regardless of status.

### Fix in `src/components/admin/AddToContentModal.tsx`
- Swap the order: show **Step 2: Select Record** immediately after picking the content type
- Move **Target Field** to Step 3 (only shown after a record is selected, and only if the content type has more than one image field)
- Auto-select the field if there's only one (already works but timing is off due to ordering)
- Remove any status/published filtering from the records query -- fetch ALL records with `.limit(500)` and no status filter (the current query already doesn't filter by status, but increase limit to catch everything)

---

## Issue 2: Drag and Rearrange Photos in Media Library

**Problem**: There's no way to reorder images in the media library grid.

### Add to `src/pages/admin/MediaLibrary.tsx`
- Add drag-and-drop support to `renderMediaCard` using HTML5 drag events (same pattern used in `EnhancedImageManager`)
- Track `draggedIndex` and `dragOverIndex` state
- On drop, update the `media_library` table's `uploaded_at` timestamps to reflect the new visual order (since the grid sorts by `uploaded_at desc`)
- Show a visual indicator (border highlight) on the drop target
- Only allow reordering for library-sourced items

---

## Issue 3: Organize by Similarity, Duplicates, and Related Images

**Problem**: The "Group by Tag" view exists but there's no way to find duplicate images, similar images, or sort by image type.

### Add new sort/filter options to `src/pages/admin/MediaLibrary.tsx`
- Add a new **Sort By** dropdown next to the existing filters with options:
  - **Date (newest)** -- default, current behavior
  - **Date (oldest)**
  - **Filename** -- alphabetical sort to surface similarly named files
  - **File size** -- groups similar-sized images together
  - **Duplicates first** -- detects images with identical URLs or filenames and surfaces them at the top with a "Duplicate" badge
  - **By type** -- groups by file extension (jpg, png, webp, etc.)

- Add **duplicate detection** logic:
  - Compare URLs and filenames across all media items
  - Mark items that share the same URL or very similar filenames (ignoring UUID prefixes) with a "Possible Duplicate" badge
  - Add a "Duplicates" option in the usage filter dropdown to show only suspected duplicates

- The existing **"Group by Tag"** view already handles category-based organization. The Auto-Tag AI feature can suggest tags like "portrait", "screenshot", "logo" etc. which handles the "related images" grouping.

---

## Files to Modify

1. **`src/components/admin/AddToContentModal.tsx`**
   - Reorder steps: Content Type -> Record -> Field
   - Show record list immediately after content type selection
   - Auto-select field when only one exists

2. **`src/pages/admin/MediaLibrary.tsx`**
   - Add drag-and-drop reordering to the grid
   - Add "Sort By" dropdown (date, filename, size, duplicates, type)
   - Add duplicate detection logic with badges
   - Add "Duplicates" filter option

