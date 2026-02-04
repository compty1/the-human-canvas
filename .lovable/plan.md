
# Comprehensive Enhancement Plan

## Summary

This plan addresses 5 specific issues:
1. Create a comprehensive Files/Media page with usage tracking and cropping
2. Add quick options dropdown for artwork cards
3. Fix bulk upload issue (only 4 images uploading)
4. Improve music favorites display (title + artist formatting)
5. Fix streaming platform logos (use SVG icons instead of emojis)

---

## Issue Analysis

### 1. Files/Media Library Enhancement
**Current State:**
- `MediaLibrary.tsx` exists at `/admin/media-library`
- Only shows items from `media_library` table (currently empty)
- Files uploaded via content editors go to `content-images` bucket but are NOT tracked in `media_library`
- Missing: usage tracking, crop functionality, comprehensive view

**Solution:**
- Enhance MediaLibrary to also scan `content-images` storage bucket
- Add "In Use" indicator by cross-referencing URLs in content tables
- Add image cropping functionality using a canvas-based cropper

### 2. Artwork Quick Options
**Current State:**
- ArtworkManager shows Edit/Delete on hover overlay
- No quick way to change category from the grid view

**Solution:**
- Add a dropdown menu (three-dot icon) on each artwork card
- Include: Quick category change, Edit, Delete, View on site

### 3. Bulk Upload Only 4 Images
**Current State:**
- Sequential upload uses `Date.now()` for filename
- Multiple uploads within same millisecond may cause filename collisions
- No error logging shown for individual failures

**Solution:**
- Add delay or unique suffix to prevent filename collisions
- Improve error handling and logging
- Use UUID-based filenames instead of timestamp

### 4. Music Favorites Display
**Current State:**
- Title shown as `<h3>{fav.title}</h3>`
- Artist shown as `<span>by {fav.artist_name || fav.creator_name}</span>`

**Solution:**
- For music type: Show title in larger text, artist in smaller text underneath (no "by" prefix)
- Keep everything else unchanged

### 5. Streaming Platform Logos
**Current State:**
- `Favorites.tsx` line 274: Uses `{platform.icon}` (emoji like "🟢", "🍎")
- `StreamingIcons.tsx` has proper SVG icons
- `FavoriteDetail.tsx` correctly uses `getStreamingIcon()` but Favorites.tsx does not

**Solution:**
- Import and use `getStreamingIcon` in Favorites.tsx
- Display SVG icons when available, fallback to emoji

---

## Implementation Details

### Phase 1: Enhanced Media Library

**Modified Files:**
- `src/pages/admin/MediaLibrary.tsx`

**New Features:**
1. **Storage Bucket Scanning**: Query `content-images` bucket directly
2. **Usage Detection**: Cross-reference URLs against:
   - `artwork.image_url`
   - `projects.image_url`, `projects.gallery_images`
   - `articles.cover_image`
   - `favorites.image_url`
   - `products.images`
   - etc.
3. **Image Cropping**: Add crop dialog with aspect ratio options
4. **Better Filtering**: Filter by in-use/unused, file type, date

**UI Additions:**
```text
+------------------------------------------------------------------+
| Files & Media                              [Upload] [Scan Storage]|
+------------------------------------------------------------------+
| [Search...] | [All ▼] [In Use ▼] [Date ▼]                        |
+------------------------------------------------------------------+
| [img]         [img]          [img]          [img]                |
| filename.jpg  header.png     logo.svg       photo.webp           |
| 245 KB        1.2 MB        12 KB           890 KB               |
| ● In Use     ○ Unused       ● In Use       ○ Unused             |
| [Crop] [Copy] [Delete]                                           |
+------------------------------------------------------------------+
```

---

### Phase 2: Artwork Quick Options

**Modified Files:**
- `src/pages/admin/ArtworkManager.tsx`

**Implementation:**
- Add dropdown menu to each artwork card (top-right corner)
- Use existing dropdown component from shadcn/ui
- Options:
  1. Quick category submenu with all category options
  2. Edit (link to editor)
  3. View on site (link to public page)
  4. Delete (with confirmation)

**UI Change:**
```text
Artwork Card (hover):
+------------------------+
| [●●●] <- dropdown     |
|  +------------------+  |
|  | Category ►       |  |
|  |   ├ Portrait     |  |
|  |   ├ Landscape    |  |
|  |   ├ Sketch       |  |
|  |   └ Colored      |  |
|  | Edit             |  |
|  | View on Site     |  |
|  | Delete           |  |
|  +------------------+  |
+------------------------+
```

---

### Phase 3: Fix Bulk Upload Issue

**Modified Files:**
- `src/components/admin/BulkArtworkUploader.tsx`

**Changes:**
1. Use crypto UUID instead of timestamp for unique filenames
2. Add small delay between uploads to prevent rate limiting
3. Improve error logging with specific failure reasons
4. Add retry logic for failed uploads

**Key Code Change:**
```typescript
// Before:
const filename = `${Date.now()}-${img.id}.${ext}`;

// After:
const uniqueId = crypto.randomUUID();
const filename = `${uniqueId}.${ext}`;
```

---

### Phase 4: Music Favorites Display

**Modified Files:**
- `src/pages/Favorites.tsx`

**Changes (lines 202-228):**
For items where `fav.type === 'music'`:
- Title in main heading
- Artist in smaller text below WITHOUT "by" prefix
- Keep all other types unchanged

**Before:**
```tsx
<h3>{fav.title}</h3>
{(fav.artist_name || fav.creator_name) && (
  <span>by {fav.artist_name || fav.creator_name}</span>
)}
```

**After:**
```tsx
<h3>{fav.title}</h3>
{fav.type === 'music' && fav.artist_name && (
  <p className="text-sm text-muted-foreground">{fav.artist_name}</p>
)}
{fav.type !== 'music' && (fav.artist_name || fav.creator_name) && (
  <span>by {fav.artist_name || fav.creator_name}</span>
)}
```

---

### Phase 5: Fix Streaming Platform Logos

**Modified Files:**
- `src/pages/Favorites.tsx`

**Changes:**
1. Import `getStreamingIcon` from StreamingIcons
2. Replace emoji display with SVG icon component

**Code Change (line 264-276):**
```tsx
// Before:
<span className="text-sm">{platform.icon}</span>

// After:
{(() => {
  const IconComponent = getStreamingIcon(key);
  return IconComponent ? (
    <IconComponent size={16} style={{ color: platform.color }} />
  ) : (
    <span className="text-sm">{platform.icon}</span>
  );
})()}
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/admin/MediaLibrary.tsx` | MODIFY | Add storage scanning, usage tracking, cropping |
| `src/pages/admin/ArtworkManager.tsx` | MODIFY | Add quick options dropdown |
| `src/components/admin/BulkArtworkUploader.tsx` | MODIFY | Fix filename collision, add delays |
| `src/pages/Favorites.tsx` | MODIFY | Fix music display, fix streaming icons |

---

## Technical Notes

### Storage Bucket Scanning
```typescript
// Fetch files from content-images bucket
const { data: storageFiles } = await supabase.storage
  .from("content-images")
  .list("", { limit: 1000 });
```

### Usage Detection Query
```typescript
// Check if URL is used in any content
const usedUrls = await Promise.all([
  supabase.from("artwork").select("image_url"),
  supabase.from("projects").select("image_url, gallery_images"),
  supabase.from("articles").select("cover_image"),
  // etc.
]);
```

### Image Cropping
- Use HTML5 Canvas for client-side cropping
- Upload cropped version as new file
- Options: 1:1, 16:9, 4:3, Free

---

## Verification Checklist

After implementation:
- [ ] Files page shows all content-images from storage
- [ ] "In Use" badge appears on files referenced in content
- [ ] Crop tool works and saves cropped version
- [ ] Artwork cards have quick options dropdown
- [ ] Category can be changed from dropdown
- [ ] Bulk upload successfully uploads 10+ images
- [ ] Music favorites show title with artist below (no "by")
- [ ] Spotify, Apple Music, YouTube show SVG logos
- [ ] All existing functionality remains unchanged
