
# Comprehensive Content Management Enhancements

## Executive Summary

This plan implements 12 productivity-boosting features to streamline content creation and management across the admin dashboard. Features range from quick-win keyboard shortcuts to more advanced capabilities like a global command palette and automated draft recovery.

---

## Feature Overview

| # | Feature | Priority | Effort | Impact |
|---|---------|----------|--------|--------|
| 1 | Global Command Palette (Ctrl+K) | High | Medium | High |
| 2 | Autosave with Draft Recovery | High | Medium | High |
| 3 | Duplicate/Clone Content | High | Low | High |
| 4 | Keyboard Shortcuts (Ctrl+S, Ctrl+P) | High | Low | Medium |
| 5 | "Generate All" AI Button | Medium | Low | Medium |
| 6 | Daily Highlights / Quick Entry | Medium | Medium | Medium |
| 7 | Media Library Browser | Medium | High | High |
| 8 | Inline Image Paste | Medium | Medium | Medium |
| 9 | URL Content Scraper | Medium | Medium | Medium |
| 10 | Content Templates | Low | Medium | Medium |
| 11 | Bulk Actions | Low | Medium | Medium |
| 12 | Version History Viewer | Low | High | Medium |

---

## Detailed Implementation

### Feature 1: Global Command Palette (Ctrl+K)

**Purpose**: Rapid navigation and actions from anywhere in the admin panel

**New Files**:
- `src/components/admin/CommandPalette.tsx`

**Modified Files**:
- `src/components/admin/AdminLayout.tsx` (mount CommandPalette)

**Functionality**:
- Opens on Ctrl+K or Cmd+K globally
- Search across all content types (projects, articles, updates, etc.)
- Quick navigation to any admin page
- Quick-create actions (New Project, New Article, etc.)
- Recent items list
- Keyboard navigation with arrow keys

**UI Structure**:
```text
+----------------------------------------------------------+
| [Search icon] Search or jump to...              Ctrl+K   |
+----------------------------------------------------------+
| Recent                                                    |
|   [clock] Edit Project: My Portfolio Site                |
|   [clock] Edit Article: Design Philosophy                |
+----------------------------------------------------------+
| Navigation                                                |
|   [folder] Projects                                       |
|   [file] Articles                                         |
|   [image] Artwork                                         |
+----------------------------------------------------------+
| Quick Actions                                             |
|   [+] New Project                                         |
|   [+] New Article                                         |
|   [+] New Update                                          |
+----------------------------------------------------------+
```

**Implementation Details**:
- Uses existing `cmdk` library (already installed)
- Leverages `src/components/ui/command.tsx` components
- Fetches recent items from Supabase on open
- Stores recent items in localStorage for quick access

---

### Feature 2: Autosave with Draft Recovery

**Purpose**: Never lose work due to browser crashes or accidental navigation

**New Files**:
- `src/hooks/useAutosave.ts`
- `src/components/admin/DraftRecoveryBanner.tsx`

**Modified Files**:
- All editor pages (ProjectEditor, ArticleEditor, etc.)

**Functionality**:
- Saves form state to localStorage every 30 seconds (debounced)
- On page load, checks for unsaved drafts
- Shows recovery banner with "Restore" or "Discard" options
- Clears draft on successful save to database
- Uses content-type + id as storage key

**Storage Key Format**:
```text
draft_project_new
draft_project_abc123
draft_article_xyz789
```

**Recovery Banner UI**:
```text
+------------------------------------------------------------------+
| [!] Unsaved draft found from 5 minutes ago                       |
|                                     [Restore Draft] [Discard]    |
+------------------------------------------------------------------+
```

**Hook Interface**:
```typescript
interface UseAutosaveOptions<T> {
  key: string;
  data: T;
  interval?: number; // default 30000ms
  enabled?: boolean;
}

interface UseAutosaveReturn<T> {
  hasDraft: boolean;
  draftData: T | null;
  draftTimestamp: Date | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  clearDraft: () => void;
}
```

---

### Feature 3: Duplicate/Clone Content

**Purpose**: Quickly create variations of existing content

**Modified Files**:
- All manager pages (ProjectsManager, ArticlesManager, etc.)
- All editor pages

**Functionality**:
- "Duplicate" button on each content card in manager views
- Creates a copy with "(Copy)" appended to title
- Opens editor with pre-filled data
- Auto-generates new unique slug

**Implementation**:
- Add duplicate handler to manager pages
- Navigate to `/admin/[type]/new?clone=[id]`
- Editor detects `clone` param and fetches source item
- Pre-fills form with cloned data (excluding id, slug, dates)

---

### Feature 4: Keyboard Shortcuts

**Purpose**: Speed up common actions with familiar shortcuts

**New Files**:
- `src/hooks/useEditorShortcuts.ts`

**Modified Files**:
- All editor pages

**Shortcuts**:
| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save (without navigating away) |
| Ctrl+Shift+S | Save and exit |
| Ctrl+P | Toggle publish/draft status |
| Ctrl+Enter | Save and continue editing |
| Escape | Cancel and go back (with confirmation if dirty) |

**Implementation**:
```typescript
useEditorShortcuts({
  onSave: () => saveMutation.mutate(),
  onTogglePublish: () => updateForm({ published: !form.published }),
  onExit: () => navigate(-1),
  isDirty: historyIndex > 0,
});
```

---

### Feature 5: "Generate All" AI Button

**Purpose**: Batch-fill all empty fields with AI in one click

**New Files**:
- `src/components/admin/AIGenerateAllButton.tsx`

**Modified Files**:
- All editor pages (add to header area)

**Functionality**:
- Scans form for empty text fields
- Shows confirmation with list of fields to generate
- Generates content for each field sequentially
- Shows progress indicator
- Allows user to review before accepting

**UI Flow**:
```text
1. Click "Generate All Empty Fields"
2. Modal shows: "Will generate: description, excerpt, tags"
3. User clicks "Generate"
4. Progress: "Generating description... (1/3)"
5. Preview generated content
6. "Apply All" or "Cancel"
```

---

### Feature 6: Daily Highlights / Quick Entry

**Purpose**: Rapid micro-journaling that aggregates into Updates

**New Files**:
- `src/components/admin/QuickEntry.tsx`
- `src/pages/admin/QuickCapture.tsx`

**Modified Files**:
- `src/pages/admin/Dashboard.tsx` (add QuickEntry widget)
- `src/App.tsx` (add route)
- `src/components/admin/AdminLayout.tsx` (add nav item)

**Database Changes**:
- New table: `quick_entries`
  - id, content, mood, tags[], created_at, aggregated_to_update_id

**Functionality**:
- Single text input + optional mood/tags
- Entries saved instantly (no form)
- "Aggregate Week" button creates Update from entries
- AI summarizes entries into cohesive update

**UI**:
```text
+------------------------------------------------------------------+
| What's happening?                                                |
| [Quick thought or accomplishment...]            [+] [mood icons] |
+------------------------------------------------------------------+
| Today's entries:                                                 |
| - Finished project landing page                        10:30 AM  |
| - Received positive feedback on UX review              2:15 PM   |
+------------------------------------------------------------------+
```

---

### Feature 7: Media Library Browser

**Purpose**: Centralized media management with search and reuse

**New Files**:
- `src/pages/admin/MediaLibrary.tsx`
- `src/components/admin/MediaBrowser.tsx`
- `src/components/admin/MediaPickerDialog.tsx`

**Modified Files**:
- `src/App.tsx` (add route)
- `src/components/admin/AdminLayout.tsx` (add nav item)
- `src/components/admin/ImageUploader.tsx` (add "Browse Library" option)

**Database Changes**:
- New table: `media_library`
  - id, url, filename, alt_text, tags[], file_size, dimensions, uploaded_at

**Functionality**:
- Grid view of all uploaded images
- Search by filename, alt text, or tags
- Filter by upload date, size, dimensions
- Click to copy URL or insert into editor
- Bulk delete unused media
- AI auto-tagging on upload

**UI**:
```text
+------------------------------------------------------------------+
| Media Library                         [Upload] [AI Tag All]      |
+------------------------------------------------------------------+
| [Search...] | Filter: [All Types v] [Date v] [Used/Unused v]    |
+------------------------------------------------------------------+
| [img] [img] [img] [img] [img] [img]                              |
| [img] [img] [img] [img] [img] [img]                              |
+------------------------------------------------------------------+
```

---

### Feature 8: Inline Image Paste

**Purpose**: Paste screenshots directly into text fields

**Modified Files**:
- `src/components/editor/RichTextEditor.tsx`
- `src/components/admin/ImageUploader.tsx`

**Functionality**:
- Detect paste event with image data
- Upload to Supabase storage automatically
- Insert URL into editor or field
- Show upload progress indicator
- Works in RichTextEditor and image upload fields

**Implementation**:
```typescript
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      await uploadAndInsert(blob);
    }
  }
};
```

---

### Feature 9: URL Content Scraper

**Purpose**: Auto-fill content from external URLs

**Modified Files**:
- `src/components/admin/BulkTextImporter.tsx` (add URL input mode)

**Edge Function Enhancement**:
- `supabase/functions/analyze-site/index.ts` (enhance for content extraction)

**Functionality**:
- Enter URL in text importer
- Scrapes title, description, main content, images
- AI structures content into form fields
- Works for:
  - GitHub repos (README, stats)
  - Product pages (name, price, description)
  - Blog posts (title, content, author)

**UI Addition to BulkTextImporter**:
```text
+------------------------------------------------------------------+
| Import from...                                                    |
| [Tab: Paste Text] [Tab: URL] [Tab: File]                         |
+------------------------------------------------------------------+
| [Enter URL to scrape content from...]           [Analyze URL]    |
+------------------------------------------------------------------+
```

---

### Feature 10: Content Templates

**Purpose**: Start new content from pre-defined templates

**New Files**:
- `src/components/admin/TemplateSelector.tsx`

**Database Changes**:
- New table: `content_templates`
  - id, name, content_type, template_data JSONB, is_default, created_at

**Modified Files**:
- All editor pages (show template selector for new items)

**Functionality**:
- Pre-fill forms with template data
- System templates + user-created templates
- "Save as Template" button in editors
- Template categories per content type

**Templates Examples**:
- Project: "Side Project", "Client Work", "Open Source"
- Article: "Tutorial", "Case Study", "Opinion Piece"

---

### Feature 11: Bulk Actions

**Purpose**: Perform actions on multiple items at once

**Modified Files**:
- All manager pages

**Functionality**:
- Checkbox selection on content cards
- Bulk actions bar appears when items selected
- Actions: Delete, Publish, Unpublish, Archive, Change Category
- Confirmation dialog before destructive actions

**UI**:
```text
+------------------------------------------------------------------+
| 3 items selected       [Publish] [Unpublish] [Delete] [Cancel]   |
+------------------------------------------------------------------+
```

---

### Feature 12: Version History Viewer

**Purpose**: View and restore previous versions of content

**Database Changes**:
- New table: `content_versions`
  - id, content_type, content_id, version_data JSONB, created_at, created_by

**New Files**:
- `src/components/admin/VersionHistory.tsx`

**Modified Files**:
- All editor pages (add "History" button)
- Save mutations (create version on save)

**Functionality**:
- View list of previous saves with timestamps
- Preview any version
- Restore previous version (creates new version)
- Compare versions side-by-side
- Auto-cleanup: keep last 20 versions per item

---

## Implementation Order

### Phase 1: Quick Wins (1-2 days)
1. **Keyboard Shortcuts** - Low effort, immediate impact
2. **Duplicate Content** - Simple URL param handling
3. **"Generate All" Button** - Builds on existing AI infrastructure

### Phase 2: Core Productivity (3-4 days)
4. **Global Command Palette** - Uses existing cmdk, high visibility
5. **Autosave with Draft Recovery** - Critical for data safety
6. **Inline Image Paste** - Streamlines media handling

### Phase 3: Advanced Features (5-7 days)
7. **Media Library Browser** - Requires new table and UI
8. **Daily Highlights / Quick Entry** - New table and aggregation
9. **URL Content Scraper** - Edge function enhancement

### Phase 4: Nice-to-Haves (3-5 days)
10. **Content Templates** - New table and selection UI
11. **Bulk Actions** - Manager page updates
12. **Version History** - New table and viewer component

---

## Database Migrations Required

```sql
-- Quick Entries for daily highlights
CREATE TABLE public.quick_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  aggregated_to_update_id UUID REFERENCES updates(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Media Library
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  tags TEXT[],
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Content Templates
CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content Versions
CREATE TABLE public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  version_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_quick_entries_created ON quick_entries(created_at DESC);
CREATE INDEX idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX idx_content_versions_lookup ON content_versions(content_type, content_id, created_at DESC);
```

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/components/admin/CommandPalette.tsx` | Global search and navigation |
| `src/hooks/useAutosave.ts` | localStorage draft management |
| `src/components/admin/DraftRecoveryBanner.tsx` | Restore draft UI |
| `src/hooks/useEditorShortcuts.ts` | Keyboard shortcut handler |
| `src/components/admin/AIGenerateAllButton.tsx` | Batch AI generation |
| `src/components/admin/QuickEntry.tsx` | Daily highlights widget |
| `src/pages/admin/QuickCapture.tsx` | Full quick entry page |
| `src/pages/admin/MediaLibrary.tsx` | Media browser page |
| `src/components/admin/MediaBrowser.tsx` | Media grid component |
| `src/components/admin/MediaPickerDialog.tsx` | Media selection dialog |
| `src/components/admin/TemplateSelector.tsx` | Template selection UI |
| `src/components/admin/VersionHistory.tsx` | Version history viewer |
| `src/components/admin/BulkActionsBar.tsx` | Multi-select actions |

---

## Technical Considerations

### Performance
- Command palette: Debounce search queries
- Autosave: Use debouncing to prevent excessive writes
- Media library: Implement pagination/virtual scrolling

### Security
- All new tables need RLS policies for admin-only access
- Version history: Ensure users can only see their own content versions

### Edge Cases
- Autosave conflict: Show "newer version exists" warning
- Duplicate: Handle unique slug constraint
- Bulk delete: Cascade handling for related records

---

## Summary

This comprehensive plan delivers 12 features that will significantly improve the admin content management experience:

- **Immediate productivity**: Keyboard shortcuts + duplicate + generate all
- **Data safety**: Autosave + version history
- **Discovery**: Command palette + media library
- **Speed**: Quick entry + templates + URL scraping + bulk actions + inline paste

Total estimated effort: 12-18 days for complete implementation
Recommended approach: Start with Phase 1-2 for immediate impact
