

# Plan: Media Library Organization, Client Work Types, and Inline Renaming

## 1. Media Library -- Inline Quick Rename

Add the ability to rename a file directly from the media grid card by clicking an edit/pencil icon.

### How it works
- Each media card in the grid gets a small pencil icon button in the hover overlay
- Clicking it enters an "edit mode" for that card: the filename text at the bottom becomes an editable input field
- Pressing Enter or clicking a checkmark saves the new name to the `media_library` table
- Pressing Escape cancels the edit
- Only items that exist in the `media_library` table (source = "library") can be renamed; storage-only items will show the button disabled or hidden

### Technical changes
- **File:** `src/pages/admin/MediaLibrary.tsx`
  - Add `editingId` and `editingName` state variables
  - On the media card, when `editingId === item.id`, replace the filename text with an `<Input>` field
  - On save, call `supabase.from("media_library").update({ filename: newName }).eq("id", editingId)`
  - Invalidate the media-library-table query on success
  - Add pencil icon button to the hover overlay actions

---

## 2. Media Library -- Organize by Tags / Grouped View

Add a "Group by Tag" view mode that visually organizes images into collapsible category sections based on their tags.

### How it works
- Add a view toggle (Grid / Grouped) next to the existing filters
- In Grouped view, images are sorted by their first tag and displayed under collapsible section headers
- Images with no tags appear under an "Uncategorized" group
- Add a "Tag Selected" bulk action button that opens a popover to assign one or more tags to all selected images
- Add an "Auto-Categorize" button that sends selected image URLs to an edge function powered by Lovable AI, which returns suggested tags

### Technical changes

**Media Library UI** (`src/pages/admin/MediaLibrary.tsx`):
- Add `viewMode` state: `"grid" | "grouped"`
- Add `tagFilter` state for filtering by a specific tag
- In grouped mode, compute groups from `filteredMedia` by first tag
- Render each group as a collapsible section with header showing tag name and count
- Add "Tag Selected" button in the selection toolbar that opens a Popover with a text input for adding/removing tags
- Tag updates call `supabase.from("media_library").update({ tags }).eq("id", id)` for each selected item

**Edge Function** (`supabase/functions/categorize-images/index.ts`):
- Accepts `{ urls: string[] }` in the request body
- Uses Lovable AI (Gemini 2.5 Flash) to analyze the images and return suggested category tags for each
- Returns `{ results: [{ url: string, tags: string[] }] }`

---

## 3. Client Work -- Project Type System

Add a `project_type` field and `type_metadata` JSONB field to `client_projects`, then show type-specific form sections in the editor and type badges on listing pages.

### Supported project types
- **Web Design / Development** -- tech stack, features, live URL (uses existing fields)
- **Logo / Branding** -- brand colors, font choices, logo variations count, brand guidelines URL
- **Business Plan** -- industry, executive summary, key sections list, deliverable format
- **Copywriting** -- content type (blog, web, ad, email), word count, tone/voice, sample excerpt
- **Product Design** -- materials, dimensions, design tools used, prototype images
- **Product Review / Analysis** -- product name, rating, key findings, methodology
- **Consulting / Strategy** -- focus area, recommendations, outcome metrics, duration
- **Social Media** -- platforms, campaign type, reach/engagement metrics
- **Photography / Video** -- equipment used, deliverables count, style/genre
- **Other** -- freeform notes

### Database migration
```sql
ALTER TABLE client_projects
  ADD COLUMN project_type text NOT NULL DEFAULT 'web_design',
  ADD COLUMN type_metadata jsonb DEFAULT '{}'::jsonb;
```

### Technical changes

**ClientProjectEditor** (`src/pages/admin/ClientProjectEditor.tsx`):
- Add project type dropdown at the top of the form (before client name)
- Based on selected type, render additional type-specific field sections in a new ComicPanel
- Type-specific fields read from and write to `form.type_metadata`
- Existing fields (tech_stack, features, testimonial) remain available for all types but are most relevant for web design
- Save `project_type` and `type_metadata` alongside existing fields

**ClientWork listing** (`src/pages/ClientWork.tsx`):
- Add project type badge on each card (next to status badge)
- Add type filter buttons alongside existing status filters

**ClientWorkManager** (`src/pages/admin/ClientWorkManager.tsx`):
- Add type badge on each card
- Add a type filter dropdown

**ClientProjectDetail** (`src/pages/ClientProjectDetail.tsx`):
- Show project type badge in the hero section
- Render type-specific metadata sections (e.g., "Brand Colors" for logo projects, "Content Details" for copywriting)

---

## Implementation Order

1. Database migration (add project_type + type_metadata columns)
2. Media Library inline rename feature
3. Client Work Editor -- project type selector + conditional fields
4. Client Work public pages -- type badges + detail rendering
5. Media Library grouped view + bulk tagging
6. Auto-categorize edge function

