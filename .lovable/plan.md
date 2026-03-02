

# Media Library Performance Fix

The Media Library is slow because it runs 3 heavy queries in parallel on every mount, scans 14 storage folders sequentially, queries 10+ content tables for usage tracking, and renders every image at full resolution with no pagination. Here's the fix plan -- all changes are admin-side only and won't affect public image quality.

---

## Root Causes

1. **Storage scan queries 14 folders sequentially** -- each is a separate API call, done on every page load
2. **Usage tracking queries 10+ tables on every load** -- artwork, projects, articles, favorites, products, experiments, experiences, life_periods, certifications, client_projects, product_reviews, inspirations
3. **No pagination** -- all items rendered in a single grid
4. **Full-resolution images used as thumbnails** -- each card loads the original file
5. **`allMedia` array and deduplication recomputed on every render** -- no memoization

---

## Changes

### 1. Add Pagination (MediaLibrary.tsx)

- Add `page` state (default 1) and `ITEMS_PER_PAGE = 48` constant
- Paginate `sortedMedia` using `.slice()` before rendering
- Add "Load More" button or page navigation at the bottom
- This immediately reduces DOM nodes from potentially hundreds to 48

### 2. Thumbnail Optimization with Supabase Transform (MediaLibrary.tsx)

Supabase Storage supports image transforms via URL parameters. For admin thumbnails only:

```typescript
// In renderMediaCard, use transformed URL for the thumbnail
const thumbUrl = `${item.url}?width=200&height=200&resize=cover`;
```

- Only the admin grid uses `?width=200` -- public pages continue using the original `item.url`
- Falls back gracefully if transforms aren't enabled (shows original)

### 3. Memoize Expensive Computations (MediaLibrary.tsx)

- Wrap `allMedia` computation in `useMemo` with deps `[libraryMedia, storageFiles, usedUrls]`
- Wrap `duplicateIds` computation in `useMemo`
- Wrap `filteredMedia`, `sortedMedia`, `groupedMedia`, `allTags`, `allFolders` in `useMemo`
- This prevents re-running deduplication/filtering on every keystroke or state change

### 4. Parallelize Storage Scanning (MediaLibrary.tsx)

Replace the sequential `for` loop (lines 168-183) with `Promise.all`:

```typescript
const results = await Promise.all(
  folders.map(folder =>
    supabase.storage.from("content-images")
      .list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })
      .then(({ data }) => ({ folder, data }))
      .catch(() => ({ folder, data: null }))
  )
);
```

This runs all 14 folder scans concurrently instead of one-by-one.

### 5. Cache Usage Tracking More Aggressively (MediaLibrary.tsx)

- Set `staleTime: 5 * 60 * 1000` (5 minutes) on the `media-usage` query
- Set `staleTime: 2 * 60 * 1000` on `media-storage-bucket` query
- These queries rarely change and don't need to re-fetch on every focus/mount

### 6. Lazy-Load Storage Scan (MediaLibrary.tsx)

- Set `enabled: false` on the `media-storage-bucket` query by default
- Only trigger it when user clicks "Scan Storage" button
- The library table query loads instantly; storage scan is the slow part
- Show a banner: "Showing library items. Click 'Scan Storage' to find untracked files."

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/MediaLibrary.tsx` | Pagination, thumbnail transforms, memoization, parallel storage scan, query caching, lazy storage scan |

No database changes. No public page changes. No image quality changes.

