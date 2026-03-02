

# Complete Implementation Plan: All Remaining Fixes

This plan addresses all outstanding gaps from the approved audit in a single implementation sweep. The work is organized into 8 batches for efficient parallel execution.

---

## Batch 1: Database Migration

A single migration covering all schema changes needed:

```text
-- No new schema changes needed beyond what's already been applied
-- (life_periods.category and media_library.folder already exist)
```

No additional migrations required.

---

## Batch 2: Admin Sidebar -- Add Knowledge Base Link

**File:** `src/components/admin/AdminLayout.tsx`

Add Knowledge Base to the "Tools" section of `navGroups`, importing `BookOpen` from lucide-react:

```
{ label: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpen }
```

---

## Batch 3: Replace ALL `confirm()` and `prompt()` Calls (21 files)

Every manager and editor file using native `confirm()` or `prompt()` must be converted to use `AlertDialog` components. This is the largest batch.

**Pattern for each file:**
1. Import `AlertDialog` components
2. Add `const [deleteId, setDeleteId] = useState<string | null>(null)` state
3. Replace `if (confirm(...)) deleteMutation.mutate(id)` with `setDeleteId(id)`
4. Add `AlertDialog` component at end of JSX

**Files to update (confirm -> AlertDialog):**
1. `LifePeriodsManager.tsx`
2. `ClientWorkManager.tsx`
3. `ProjectsManager.tsx`
4. `InspirationsManager.tsx`
5. `FavoritesManager.tsx`
6. `SkillsManager.tsx` (verify)
7. `ExperiencesManager.tsx`
8. `ArticlesManager.tsx`
9. `FuturePlansManager.tsx`
10. `UpdatesManager.tsx`
11. `SuppliesManager.tsx`
12. `ProductsManager.tsx`
13. `ProductReviewsManager.tsx`
14. `LearningGoalsManager.tsx`
15. `NotesManager.tsx`
16. `ArtworkManager.tsx`
17. `ExperimentsManager.tsx` (verify)
18. `CertificationsManager.tsx` (verify)
19. `UpdateEditor.tsx` -- `window.confirm` in handleDelete
20. `ArticleEditor.tsx` -- `window.confirm` in handleDelete
21. `MediaLibrary.tsx` -- `confirm()` in handleBulkDeleteDuplicates

**Files to update (prompt -> DatePicker dialog):**
22. `ContentLibrary.tsx` -- `prompt("Enter scheduled date...")` -> schedule dialog with date input
23. `ContentReviewManager.tsx` -- same `prompt()` pattern

---

## Batch 4: Dashboard -- Add Missing Stats

**File:** `src/pages/admin/Dashboard.tsx`

Add queries for missing content types and fix duplicate "Experiments" stat card:
- Add `knowledge_entries` count
- Add `media_library` count
- Add `life_periods` count
- Add `inspirations` count
- Remove duplicate "Experiments" StatCard (appears twice at lines 132-137 and 173-179)
- Add `client_projects` and `product_reviews` counts

---

## Batch 5: Content Library -- Add Missing Content Types

**File:** `src/pages/admin/ContentLibrary.tsx`

Currently only shows articles, updates, and projects. Add:
- `experiments` (has `review_status` and `scheduled_at`)
- `product_reviews` (has `review_status`, `scheduled_at`, `published`)

Update the `ContentType` type, `typeIcons`, `typeColors`, and the query function to fetch from these two additional tables. Add "New Experiment" and "New Review" quick-add buttons.

---

## Batch 6: ArtGallery Public Page Fixes

**File:** `src/pages/ArtGallery.tsx`

1. **Fetch `images` array** -- Add `images` to the select query
2. **Add missing categories** -- Add `portrait`, `landscape`, `pop_art` to the categories array
3. **Show images gallery in detail modal** -- Render thumbnail strip for `images[]` below main image
4. **Wire likes to database** -- Replace local `Set` state with actual DB calls using `supabase.from("likes")` and `supabase.rpc("get_like_count")`
5. **Dynamic period sections** -- Derive from actual artwork dates rather than hardcoded ranges, or fetch from `life_periods` table

---

## Batch 7: Media Library Folder Management UI

**File:** `src/pages/admin/MediaLibrary.tsx`

1. **Folder sidebar/bar** -- Show all unique folders with counts above the grid
2. **Create folder** -- Dialog with input to create a new folder name
3. **Move to folder** -- Bulk action button in selection toolbar, dropdown of existing folders + "New Folder"
4. **Upload to folder** -- When a folder is selected, new uploads get assigned to that folder
5. **Rename/delete folder** -- Context menu on folder items
6. **Select All button** -- Add "Select All Visible" checkbox
7. **Delete confirmation dialog** -- Replace remaining `confirm()` in `handleBulkDeleteDuplicates` with AlertDialog

---

## Batch 8: Knowledge Base Widget Delete Confirmation

**File:** `src/components/admin/KnowledgeEntryWidget.tsx`

The widget's delete button (line 156-161) calls `deleteMutation.mutate(entry.id)` directly with no confirmation. Add:
1. `deleteEntryId` state
2. AlertDialog confirmation before deleting
3. This is a small but important UX fix since deletes are permanent

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| `AdminLayout.tsx` | Add Knowledge Base to sidebar nav |
| `Dashboard.tsx` | Add 4+ missing stat cards, remove duplicate Experiments card |
| `ContentLibrary.tsx` | Add experiments + product_reviews types, replace `prompt()` with date dialog |
| `ContentReviewManager.tsx` | Replace `prompt()` with date dialog |
| `ArtGallery.tsx` | Fetch images[], add categories, wire likes to DB, dynamic periods |
| `MediaLibrary.tsx` | Folder management UI, select all, replace confirm() with AlertDialog |
| `KnowledgeEntryWidget.tsx` | Add delete confirmation AlertDialog |
| `LifePeriodsManager.tsx` | Replace confirm() with AlertDialog |
| `ClientWorkManager.tsx` | Replace confirm() with AlertDialog |
| `ProjectsManager.tsx` | Replace confirm() with AlertDialog |
| `InspirationsManager.tsx` | Replace confirm() with AlertDialog |
| `FavoritesManager.tsx` | Replace confirm() with AlertDialog |
| `ExperiencesManager.tsx` | Replace confirm() with AlertDialog |
| `ArticlesManager.tsx` | Replace confirm() with AlertDialog |
| `FuturePlansManager.tsx` | Replace confirm() with AlertDialog |
| `UpdatesManager.tsx` | Replace confirm() with AlertDialog |
| `SuppliesManager.tsx` | Replace confirm() with AlertDialog |
| `ProductsManager.tsx` | Replace confirm() with AlertDialog |
| `ProductReviewsManager.tsx` | Replace confirm() with AlertDialog |
| `LearningGoalsManager.tsx` | Replace confirm() with AlertDialog |
| `NotesManager.tsx` | Replace confirm() with AlertDialog |
| `ArtworkManager.tsx` | Replace confirm() with AlertDialog |
| `ExperimentsManager.tsx` | Replace confirm() with AlertDialog |
| `CertificationsManager.tsx` | Replace confirm() with AlertDialog |
| `UpdateEditor.tsx` | Replace window.confirm() with AlertDialog |
| `ArticleEditor.tsx` | Replace window.confirm() with AlertDialog |

**Total: ~26 files modified, 0 files created, 0 migrations needed**

