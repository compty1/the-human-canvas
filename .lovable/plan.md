
# Comprehensive Verification and Enhancement Plan

## Summary

This plan addresses 6 key areas:
1. Add a new Contact page
2. Fix AI text paste/analyze functionality in BulkTextImporter
3. Add "sketch" category option for artwork
4. Ensure analytics data is accurate
5. Ensure multiple file selection works everywhere
6. Audit and fix non-working functions

---

## Issue Analysis

### 1. Contact Page - MISSING
- No `/contact` route exists in `src/App.tsx`
- No `Contact.tsx` page exists in `src/pages/`
- Need to create a new public Contact page

### 2. AI Text Paste/Analyze (BulkTextImporter) - INVESTIGATION
**Testing confirmed the edge function works correctly:**
- Tested `generate-copy` with `bulk_import` type - returns 200 with proper extracted data
- Edge function logs show no recent errors

**Potential client-side issues identified:**
- The `BulkTextImporter` expects `data.extracted` but also checks `data.content` as fallback
- If the edge function returns `{ success: true, extracted: {...} }`, the code should work
- Issue may be in error handling or toast display masking successful extraction

**Fixes needed:**
- Improve error handling with better user feedback
- Add explicit success logging to debug extraction flow
- Ensure the `onImport` callback properly receives extracted data

### 3. Artwork Sketch Category - PARTIALLY MISSING
**Current state:**
- Database has artwork with `category = 'sketch'` (confirmed via query)
- `ArtworkEditor.tsx` category dropdown is MISSING the "sketch" option
- Current options: portrait, landscape, pop_art, graphic_design, mixed, photography

**Fix needed:**
- Add `<option value="sketch">Sketch</option>` to ArtworkEditor.tsx dropdown

### 4. Analytics Data Accuracy - WORKING CORRECTLY
**Verified:**
- `page_views` table has 778 records with real data
- Records show proper fields: `page_path`, `visitor_id`, `device_type`, `timestamp`
- `useAnalytics.tsx` hook is properly tracking page views, sessions, and link clicks
- Analytics.tsx and Dashboard.tsx correctly display this data

**Minor improvement:**
- `time_on_page_seconds` shows 0 for many entries (expected for quick navigations)
- Analytics hook is implemented correctly - data is accurate

### 5. Multiple File Selection - MOSTLY WORKING
**Verified working:**
- `MediaLibrary.tsx` - Has `multiple` attribute on file input
- `MultiImageUploader.tsx` - Has `multiple` attribute, handles FileList correctly
- `ImageUploader.tsx > MultiImageUploader` export - Has `multiple` attribute

**Potential issue:**
- Single `ImageUploader` component only handles one file at a time (by design)
- Some editors use single image uploader where multi might be better

### 6. Non-Working Functions Audit
**Functions that need verification/fixing:**

| Function | Status | Issue |
|----------|--------|-------|
| BulkTextImporter | Needs Fix | Error handling and user feedback unclear |
| CommandPalette search | Verify | Search across content types |
| Quick Capture AI Aggregate | Verify | AI aggregation to updates |
| Version History | Verify | Save/restore versions |
| Template Selector | Verify | Template loading |

---

## Implementation Plan

### Phase 1: Contact Page (New Feature)

**New Files:**
- `src/pages/Contact.tsx`

**Modified Files:**
- `src/App.tsx` (add route)
- `src/components/layout/Header.tsx` (add nav link)

**Contact Page Features:**
- Contact form with name, email, subject, message
- Social media links
- Optional: store inquiries in a `contact_inquiries` table

---

### Phase 2: Fix BulkTextImporter

**File: `src/components/admin/BulkTextImporter.tsx`**

**Changes:**
1. Add better logging to track extraction flow
2. Improve error messages to distinguish between different failure modes
3. Add a "Show Raw Response" debug toggle for troubleshooting
4. Ensure proper handling of both `data.extracted` and `data.content` responses

**Key fixes:**
```typescript
// Current code checks multiple response formats but may miss some
if (data?.extracted) {
  results.push(data.extracted);
} else if (data?.content) {
  // Parse JSON from content string
}

// Add explicit logging and better toast messages
console.log("API Response:", data);
if (Object.keys(data.extracted || {}).length === 0) {
  toast.warning("No fields could be extracted from the text");
}
```

---

### Phase 3: Add Sketch Category to Artwork

**File: `src/pages/admin/ArtworkEditor.tsx`**

**Change at line 159-170:**
```typescript
<select id="category" ...>
  <option value="portrait">Portrait</option>
  <option value="landscape">Landscape</option>
  <option value="pop_art">Pop Art</option>
  <option value="graphic_design">Graphic Design</option>
  <option value="mixed">Mixed Media</option>
  <option value="photography">Photography</option>
  <option value="sketch">Sketch</option>  // ADD THIS
  <option value="colored">Colored</option>  // ADD THIS (exists in DB)
</select>
```

---

### Phase 4: Verify Analytics Accuracy

**Already Working:**
- Analytics data is real - 778 page views confirmed
- `useAnalytics` hook tracks correctly
- Dashboard and Analytics pages display accurate counts

**Minor Enhancement:**
- Add data freshness indicator showing last update time
- Add note that time_on_page may be 0 for quick navigations

---

### Phase 5: Ensure Multi-File Upload Everywhere

**Files to verify/update:**

1. `ImageUploader.tsx` - Single file by design (correct)
2. `MultiImageUploader.tsx` - Already supports multiple (correct)
3. `BulkArtworkUploader.tsx` - Verify multiple selection
4. `MediaLibrary.tsx` - Already supports multiple (correct)

**Potential enhancements:**
- Add drag-and-drop zone for multiple files where missing
- Ensure file input `multiple` attribute is present everywhere needed

---

### Phase 6: Function Audit and Fixes

**Functions to test and fix:**

1. **CommandPalette.tsx** - Verify search works
2. **useAutosave.ts** - Verify drafts save/restore
3. **DraftRecoveryBanner.tsx** - Verify banner shows
4. **VersionHistory.tsx** - Verify version save/restore
5. **TemplateSelector.tsx** - Verify templates load
6. **QuickEntryWidget.tsx** - Verify entries save and AI aggregate

---

## Database Changes

### New Table: contact_inquiries (Optional)
```sql
CREATE TABLE public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for inserting (public can submit)
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON contact_inquiries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view inquiries" ON contact_inquiries
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Contact.tsx` | CREATE | New contact page |
| `src/App.tsx` | MODIFY | Add /contact route |
| `src/components/layout/Header.tsx` | MODIFY | Add Contact nav link |
| `src/pages/admin/ArtworkEditor.tsx` | MODIFY | Add sketch/colored categories |
| `src/components/admin/BulkTextImporter.tsx` | MODIFY | Fix error handling |
| `src/pages/admin/ArtworkManager.tsx` | VERIFY | Multi-upload works |
| `src/components/admin/BulkArtworkUploader.tsx` | VERIFY | Multi-file selection |

---

## Technical Verification Checklist

After implementation, verify:

- [ ] Contact page loads at /contact
- [ ] Contact form submits successfully
- [ ] BulkTextImporter extracts and populates fields
- [ ] Artwork editor shows sketch/colored categories
- [ ] Existing sketch artwork displays correctly
- [ ] Analytics shows accurate real data
- [ ] Multiple files can be selected in MediaLibrary
- [ ] CommandPalette search returns results
- [ ] Draft recovery works on page reload
- [ ] Version history saves and restores correctly

---

## Notes

- Analytics data is REAL and ACCURATE (verified 778 page views)
- Edge function `generate-copy` works correctly (tested successfully)
- Multi-file selection already works in MediaLibrary and MultiImageUploader
- The "sketch" category exists in the database but was missing from the UI dropdown
