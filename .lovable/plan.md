

# Admin Workflow Enhancements for Bulk Content Management

Based on your current setup, here are high-impact enhancements organized by effort and value.

---

## 1. Inline Quick-Edit Drawer (High Impact)

Right now, editing any item requires navigating to a full editor page. For quick fixes (title typos, toggling published status, updating a description), a slide-out drawer on manager pages would save significant time.

- Add a "Quick Edit" icon button next to each item in manager lists
- Opens a `Sheet` (side drawer) with the most common fields for that content type (title, description, status, tags)
- Save updates inline without leaving the list view
- Especially useful when reviewing and polishing many items in sequence

## 2. Bulk Tag/Category Editor

You have bulk publish/unpublish/delete via `BulkActionsBar`, but no way to bulk-assign tags or categories.

- Extend `BulkActionsBar` with a "Set Tags" and "Set Category" action
- A popover lets you pick or type tags to add/remove across all selected items
- Works on tables that have `tags` or `category` columns (articles, updates, favorites, inspirations, artwork, experiments)

## 3. Drag-and-Drop Reordering for Ordered Content

Tables like `experiences`, `certifications`, and `life_periods` have an `order_index` column. Currently there is no drag-to-reorder UI.

- Add a dedicated "Reorder" mode toggle on those manager pages
- Uses a drag handle list (no library needed -- simple pointer event handlers updating `order_index`)
- Persists new order with a single batch update on drop

## 4. Global "Recent Edits" Sidebar Widget

The Command Palette shows recent items, but only when opened. A persistent "Recent" widget on the Dashboard would let you jump back to items you were just working on.

- Show the last 10 edited items across all content types (query by `updated_at DESC`)
- Each row shows type icon, title, and "X minutes ago"
- One-click to resume editing

## 5. Multi-Content Quick Create Modal

Instead of navigating to `/admin/[type]/new` for each item, a floating "+" button opens a modal where you pick the content type and fill in just the title (and optionally a few key fields). The record is created as a draft immediately.

- Accessible from any admin page via a floating action button or keyboard shortcut (e.g., `Ctrl+N`)
- Dropdown to select content type, then a minimal form (title + category/type)
- Creates a draft record and optionally opens the full editor

## 6. Clipboard Paste-to-Create

Enhance the existing Quick Capture concept: when you paste text on any manager page, detect it and offer to create a new draft with that text as the content/description.

- Listen for `paste` events on manager pages
- Show a toast: "Create new [type] from clipboard?" with a confirm button
- Pre-fills the content field with pasted text

## 7. Batch Status Overview Panel

A small dashboard widget showing content health at a glance across all types:

- X drafts, Y published, Z missing descriptions, W without images
- Clickable counts that filter the Content Library view
- Helps prioritize which content needs attention during bulk organization sessions

---

## Technical Approach

### Inline Quick-Edit Drawer
- Create `src/components/admin/QuickEditDrawer.tsx` using the existing `Sheet` component from `src/components/ui/sheet.tsx`
- Accept `tableName`, `recordId`, and a field config array
- Fetch the record, render form fields, save via `supabase.from(table).update()`
- Integrate into each manager page's row actions

### Bulk Tag/Category Editor
- Extend `BulkActionsBar` with new action types: `"set-tags"` and `"set-category"`
- Create a `TagBulkEditor` popover component that shows existing tags and lets you add/remove
- Uses `supabase.from(table).update({ tags }).in("id", selectedIds)`

### Drag-and-Drop Reordering
- Create `src/components/admin/ReorderableList.tsx` using native pointer events
- On drag end, compute new `order_index` values and batch-update via Supabase
- Add a "Reorder" toggle button to `ExperiencesManager`, `CertificationsManager`, `LifePeriodsManager`

### Recent Edits Widget
- Create `src/components/admin/RecentEditsWidget.tsx`
- Query multiple tables with `updated_at DESC LIMIT 3` each (same pattern as Command Palette's recent items query)
- Render on Dashboard page

### Multi-Content Quick Create
- Create `src/components/admin/QuickCreateModal.tsx`
- Register a `Ctrl+N` shortcut in `AdminLayout`
- Content type selector + minimal form fields per type
- Insert draft record and navigate to editor

### Batch Status Overview
- Create `src/components/admin/ContentHealthWidget.tsx`
- Parallel queries counting records by status, checking for empty required fields
- Render as clickable stat cards on Dashboard

---

## Suggested Priority Order

1. **Inline Quick-Edit Drawer** -- biggest time saver for polishing content
2. **Bulk Tag/Category Editor** -- essential for organizing large batches
3. **Multi-Content Quick Create** -- speeds up initial content entry
4. **Drag-and-Drop Reordering** -- needed for ordered content types
5. **Batch Status Overview** -- helps prioritize work
6. **Recent Edits Widget** -- nice convenience
7. **Clipboard Paste-to-Create** -- power-user feature

I can implement these in priority order. Which ones interest you, or shall I start from the top?

