# Implementation Plan: Image Management, Media Editing, Knowledge Base & Experiments Enhancements

## Overview
Five major feature areas to implement across the admin and public-facing site.

---

## Phase 1: Enhanced Image Management in Editors (Experiments + Others)
**Goal:** Add drag-to-reorder, set-as-main-image, multi-select from library for all editors with image fields.

### 1A. Upgrade MultiImageUploader Component
- **File:** `src/components/admin/MultiImageUploader.tsx`
- Add drag-and-drop reorder (already partially exists in the standalone version)
- Add "Set as Main Image" button on each thumbnail — moves that image URL to `image_url` field and shifts previous main to screenshots
- Add "Select from Library" button that opens `MediaLibraryPicker` in multi-select mode
- Visual indicators: main image badge, reorder grip handles, hover actions

### 1B. Update MediaLibraryPicker for Multi-Select
- **File:** `src/components/admin/MediaLibraryPicker.tsx`
- Add `multiSelect` prop (boolean)
- When multi-select enabled, allow checking multiple images and return array of URLs
- Add "Select All" / "Deselect All" controls

### 1C. Update All Editors Using Images
Apply the enhanced uploader to:
- `src/pages/admin/ExperimentEditor.tsx` — cover image + screenshots with reorder + set-as-main
- `src/pages/admin/ProjectEditor.tsx` — same pattern
- `src/pages/admin/ExperienceEditor.tsx` — same pattern
- `src/pages/admin/ClientProjectEditor.tsx` — same pattern
- `src/pages/admin/ProductReviewEditor.tsx` — same pattern
- `src/pages/admin/ProductEditor.tsx` — same pattern

---

## Phase 2: Media Library Photo Editing Tools
**Goal:** Add rotate, remove background, auto-crop whitespace to media library with batch support and review/approval.

### 2A. Client-Side Image Editing Utilities
- **New file:** `src/lib/imageEditing.ts`
- `rotateImage(url, degrees)` — uses Canvas API to rotate 90°/180°/270°
- `removeWhitespace(url)` — uses Canvas API to detect and crop white/near-white borders
- `flipImage(url, direction)` — horizontal/vertical flip

### 2B. AI Background Removal via Edge Function
- **New file:** `supabase/functions/remove-background/index.ts`
- Uses canvas-based approach with tolerance-based flood fill for simple backgrounds
- Accepts image URL, returns processed image URL stored in content-images bucket
- Support batch processing: accept array of URLs
- Enhancement: Use Lovable AI for complex images

### 2C. Review & Approval Workflow for Edits
- **New file:** `src/components/admin/ImageEditPreview.tsx`
- Side-by-side before/after preview modal
- "Approve & Save" / "Discard" buttons
- For batch operations: carousel of before/after pairs with approve-all option

### 2D. Media Library UI Integration
- **File:** `src/pages/admin/MediaLibrary.tsx`
- Add toolbar buttons: Rotate, Remove Background, Auto-Crop
- Single image: right-click or hover menu with edit options
- Multi-select: batch toolbar appears with all edit options
- All edits go through the review/approval modal before saving

---

## Phase 3: Knowledge Base System
**Goal:** Store rich information, data, notes on all items to build a growing knowledge base.

### 3A. Database Migration — `knowledge_entries` Table
```sql
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3B. Knowledge Base Admin UI
- **New file:** `src/pages/admin/KnowledgeBase.tsx`
- Searchable, filterable list of all knowledge entries
- Filter by entity_type, category, tags
- Rich text editor for content
- Link to related entities
- AI-powered analysis button

### 3C. Knowledge Entry Widget in All Editors
- **New file:** `src/components/admin/KnowledgeEntryWidget.tsx`
- Collapsible panel at bottom of each editor
- Shows existing knowledge entries linked to this item
- Quick-add form for new entries

### 3D. Add Routes
- Add `/admin/knowledge-base` route and nav entry

---

## Phase 4: Show Experiment Images on Listing Page
**Goal:** Display all screenshots under each experiment's description on `/experiments`.

### 4A. Update Experiments Listing Page
- **File:** `src/pages/Experiments.tsx`
- After description, render horizontal scrollable row of screenshot thumbnails
- Clicking opens lightbox or navigates to detail

---

## Phase 5: Month-Only Dates for Experiments
**Goal:** Allow month/year dates without requiring a specific day.

### 5A. Update Date Inputs in ExperimentEditor
- **File:** `src/pages/admin/ExperimentEditor.tsx`
- Change `type="date"` to `type="month"`
- Store as `YYYY-MM-01` in DB, display as `YYYY-MM` in editor

### 5B. Update Date Display
- **Files:** `src/pages/Experiments.tsx`, `src/pages/ExperimentDetail.tsx`
- Show month/year format (e.g., "Jan 2023")

---

## Implementation Order
1. **Phase 5** — Month-only dates (quick win)
2. **Phase 4** — Show images on listing page (small UI change)
3. **Phase 1** — Image management upgrades (medium)
4. **Phase 2** — Media library editing (complex)
5. **Phase 3** — Knowledge base (independent)
