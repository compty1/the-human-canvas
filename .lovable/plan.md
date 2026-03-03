

# Fix Admin Content Visibility and Category Sync Issues -- Expanded

## Problems Found

### 1. Artwork pagination hides most content (CRITICAL -- 147 items)
The artwork table has 147 items, but the admin manager uses default `pageSize=20`. Only 20 items show per page with no "show all" option, making it appear like most artwork is missing compared to the public gallery which shows everything.

### 2. Hardcoded artwork categories are out of sync (BOTH admin and public)
**Database categories:** colored, graphic_design, mixed, Older Sketches, photography, sketch, Sketch

**Admin `ALL_CATEGORIES` array** includes categories that don't exist in DB (portrait, landscape, abstract, digital, traditional, pop_art) and is missing "Older Sketches" and "Sketch" (capital S). The "Change Category" dropdown only shows the hardcoded list.

**Public `ArtGallery.tsx` categories** (lines 66-76) is a different hardcoded list that also doesn't match DB. It includes portrait, landscape, pop_art but is missing "Older Sketches" and "graphic_design" from DB.

### 3. Experiences categories completely mismatched
**Database categories:** "Creative E-commerce" (1 entry)
**Hardcoded in both admin and public:** creative, business, technical, service, other

The single experience with category "Creative E-commerce" does NOT match any hardcoded filter, so it only appears under "all" and is invisible when any specific category filter is selected. Both admin (`ExperiencesManager.tsx` line 122) and public (`Experiences.tsx` line 37) have the same problem.

### 4. Admin Projects manager missing status filters
Admin `ProjectsManager.tsx` hardcodes status filters as `["all", "live", "in_progress", "planned"]` (line 139), but the public `Projects.tsx` also references `finishing_stages` and `final_review` statuses (lines 14-18). Any project with those statuses would be invisible when filtering in admin.

### 5. No "Show All" option in admin pagination
The `SortPaginationBar` only supports page-by-page navigation with no way to view all items at once. For visual content like artwork (147 items), this makes it seem like content is missing.

### 6. No total count context in pagination
The pagination shows "page X / Y" but no "Showing items X-Y of Z" label, making it unclear how much content exists beyond the current page.

---

## Changes

### File 1: `src/components/admin/AdminListControls.tsx`
- Add optional `allowShowAll` prop to `useAdminListControls` that enables a "Show All" toggle
- When "Show All" is active, `paginated` returns all sorted items instead of a slice
- Add "Showing X-Y of Z" label to `SortPaginationBar` for context
- Add a "Show All / Paginate" toggle button next to pagination controls

### File 2: `src/pages/admin/ArtworkManager.tsx`
- Remove hardcoded `ALL_CATEGORIES` array entirely
- Build dynamic category list from the fetched artwork data (extract unique `category` values)
- Use dynamic categories for both the filter pills AND the "Change Category" dropdown menu
- Increase `pageSize` from 20 to 48 (4 columns x 12 rows)
- Pass `allowShowAll` to enable the "Show All" toggle

### File 3: `src/pages/ArtGallery.tsx` (public gallery)
- Remove hardcoded `categories` array (lines 66-76)
- Build category filter list dynamically from the fetched artwork data
- This ensures the public page always shows filters matching actual DB content

### File 4: `src/pages/Experiences.tsx` (public)
- Replace hardcoded `categories` array with dynamic extraction from fetched data
- This ensures "Creative E-commerce" and any future categories appear as filters

### File 5: `src/pages/admin/ExperiencesManager.tsx`
- Replace hardcoded `categories` array (line 122) with dynamic extraction from fetched experiences data

### File 6: `src/pages/admin/ProjectsManager.tsx`
- Replace hardcoded status filter list (line 139) with dynamic extraction from fetched projects data
- Ensure `finishing_stages` and `final_review` appear when projects have those statuses

---

## Technical Details

**Dynamic categories/types approach (all affected files):**
```text
1. After fetching data, extract unique non-null values for the filter field
2. Sort alphabetically, prepend "all"
3. Use for filter buttons/pills
4. For artwork admin: also use for "Change Category" dropdown
```

**Pagination enhancement (`AdminListControls.tsx`):**
```text
- New optional state: showAll (boolean), controlled by allowShowAll prop
- When showAll=true: paginated returns sorted (all items)
- Toggle button renders next to existing pagination controls
- "Showing 1-48 of 147" label added to SortPaginationBar
```

**Files modified:** 6 total
- `src/components/admin/AdminListControls.tsx`
- `src/pages/admin/ArtworkManager.tsx`
- `src/pages/ArtGallery.tsx`
- `src/pages/Experiences.tsx`
- `src/pages/admin/ExperiencesManager.tsx`
- `src/pages/admin/ProjectsManager.tsx`

No database changes needed.
