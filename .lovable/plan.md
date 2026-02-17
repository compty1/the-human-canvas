
# Plan: Artwork Multi-Image, Per-Item AI Chat, and Media Library "Add to Content"

## 1. Multiple Images for Artwork

Currently each artwork entry has only a single `image_url` field. This adds an `images` text array column for process photos, stages, etc.

### Database migration
```sql
ALTER TABLE artwork ADD COLUMN images text[] DEFAULT '{}'::text[];
```

### Changes
- **`src/pages/admin/ArtworkEditor.tsx`**: Add `EnhancedImageManager` component below the main image uploader for managing the `images` array (drag-reorder, add from library, set as main). Import existing `EnhancedImageManager` and `MediaLibraryPicker` components already built in Phase 1.
- **`src/pages/ArtGallery.tsx`** (or artwork detail view): Show additional images in a small gallery/thumbnail row when viewing an artwork piece.
- **`src/components/admin/AddToContentModal.tsx`**: Update the artwork config to include the new `images` array field so media library can target it, and change artwork from "create new entry" mode to also support "add to existing artwork" with both `image_url` (single) and `images` (array) fields.

---

## 2. Per-Item AI Chat with Saved Conversations and Knowledge Base Integration

Add a dedicated AI chat panel to each individual content editor (projects, experiences, life periods, experiments, artwork, articles, client projects, etc.) that:
- Persists conversations in the `ai_conversations` table linked to the entity
- Allows re-accessing past conversations
- Has a "Save to Knowledge Base" button on each AI message to add insights to the `knowledge_entries` table for that item

### New component
- **`src/components/admin/ItemAIChatPanel.tsx`**: A new component wrapping the existing `AIChatAssistant` pattern but with:
  - Conversation persistence: loads/saves messages from `ai_conversations` table using metadata to filter by entity type + entity ID
  - Conversation list: shows past conversations for this item, ability to switch between them or start a new one
  - "Add to Knowledge Base" button on each assistant message that creates a `knowledge_entries` record linked to the current entity
  - Props: `entityType`, `entityId`, `entityTitle`, `context`

### Database changes
- Add `entity_type` (text, nullable) and `entity_id` (uuid, nullable) columns to `ai_conversations` table so conversations can be linked to specific items.

```sql
ALTER TABLE ai_conversations 
  ADD COLUMN entity_type text,
  ADD COLUMN entity_id uuid;
```

### Editor integrations
Add `ItemAIChatPanel` to the following editors (alongside or replacing the existing `AIChatAssistant`):
- `ExperimentEditor.tsx`
- `ProjectEditor.tsx`
- `ExperienceEditor.tsx`
- `ClientProjectEditor.tsx`
- `ArtworkEditor.tsx`
- `ArticleEditor.tsx`
- `LifePeriodEditor.tsx`
- `ProductReviewEditor.tsx`
- `FavoriteEditor.tsx`
- `InspirationEditor.tsx`
- `CertificationEditor.tsx`
- `UpdateEditor.tsx`

Each editor will pass its entity type, ID, title, and relevant form context to the chat panel.

---

## 3. Media Library "Add to Content" -- Full Wiring

The `AddToContentModal` component already exists and supports 12 content types. The needed improvements:

### Changes to `src/components/admin/AddToContentModal.tsx`
- Update the `artwork` config entry: instead of only creating new artwork entries, support both "Create new artwork entry" AND "Add to existing artwork" (using the new `images` array field)
- Add `updates` content type config (if not already present) with any image fields

### Changes to `src/pages/admin/MediaLibrary.tsx`
- The "Add to Content" button and modal are already wired. Verify the flow works end-to-end: select images, click "Add to Content", pick content type, pick record, pick field, save. No new code needed here beyond ensuring the button is visible and functional in the selection toolbar.

---

## Implementation Order

1. Database migration (artwork.images + ai_conversations entity columns)
2. `ArtworkEditor.tsx` -- add `EnhancedImageManager` for multi-image support
3. `AddToContentModal.tsx` -- update artwork config for existing entries + images array
4. `ItemAIChatPanel.tsx` -- new component with persistence and knowledge base integration
5. Integrate `ItemAIChatPanel` into all editors

## Technical Notes

- The `EnhancedImageManager` component (already built) handles drag-reorder, "set as main", library picker, and upload -- it will be reused directly for artwork.
- The `ai_conversations` table already exists with `messages` jsonb and `title` fields. Adding `entity_type` and `entity_id` allows filtering conversations per item.
- The `knowledge_entries` table already exists with `entity_type`, `entity_id`, `title`, `content`, `category`, and `tags` fields -- perfect for storing AI-generated insights.
- The `AddToContentModal` already handles both "single" (replace) and "array" (append) field types, so adding artwork's `images` array is straightforward.
