

# Fix Content Suggestions Accuracy, Media Library Content Linking, and AI Editor Context

## Problem Summary

Three interconnected issues are degrading the admin editing experience:

1. **Content Suggestions show false positives** -- The suggestions panel reports "missing content" for fields that either don't exist on certain tables or already have data. The root cause is a broad SELECT query that requests columns like `content`, `excerpt`, `summary`, `tags`, `features` from tables that don't have those columns (e.g., `artwork` has no `content` column). The query returns `null` for non-existent columns, which the checker interprets as "missing." There's also no manual refresh button.

2. **Media Library can only add images to Artwork** -- The "Add to Content" action only supports adding media to the artwork gallery. There's no way to attach images from the media library to life periods, articles, projects, experiences, or any other content type.

3. **AI editor assistants don't reference existing content** -- The `AIChatAssistant` and `AIGenerateButton` components pass minimal context (just the current form fields as a string). They don't include information about what content already exists in the database, making the AI unable to cross-reference or suggest connections.

---

## Technical Plan

### 1. Fix ContentSuggestions accuracy and add refresh

**File: `src/components/admin/ContentSuggestions.tsx`**

- Replace the single broad `SELECT` with per-table queries that only request columns defined in `CONTENT_FIELDS[table]` plus the base fields (`id`, `title`, `name`, `slug`, `updated_at`, `published`). This eliminates false nulls from non-existent columns.
- Change the query from selecting all columns blindly:
  ```
  // BEFORE (broken): requests columns that don't exist on every table
  .select("id, title, name, slug, updated_at, published, review_status, description, content, excerpt, image_url, ...")
  
  // AFTER (accurate): only request columns the table actually has
  const selectFields = ["id", "title", "name", "slug", "updated_at", "published", ...CONTENT_FIELDS[table]];
  .select(selectFields.join(", "))
  ```
- Add `refetchOnWindowFocus: true` and expose `refetch` to add a manual refresh button.
- Accept a `refetchKey` prop so parent components can trigger refresh after content changes.
- Add a refresh button in the header alongside the suggestion count.

**File: `src/pages/admin/ContentHub.tsx`**

- Add a "Refresh" button next to the Suggestions tab that calls `queryClient.invalidateQueries({ queryKey: ["content-suggestions"] })`.
- Remove the separate `suggestionsCount` query (which duplicates logic) and derive the count from the main suggestions data instead.

### 2. Media Library "Add to Content" for all content types

**File: `src/pages/admin/MediaLibrary.tsx`**

- Replace the single "Add to Artwork" button/modal with an "Add to Content" system that supports multiple target content types.
- The new modal will have two steps:
  1. **Select content type**: dropdown with options -- Articles (featured_image), Projects (image_url, screenshots), Life Periods (image_url, images), Experiences (image_url, screenshots), Experiments (image_url, screenshots), Favorites (image_url), Client Projects (image_url), Products (images), Certifications (image_url), Inspirations (image_url)
  2. **Select target record**: searchable list of existing records from the chosen table, fetched on demand
  3. **Select field**: which image field to update (e.g., `image_url` for single, `screenshots`/`images` for array append)
- For single-image fields (`image_url`, `featured_image`): update/replace the value
- For array fields (`screenshots`, `images`): append selected URLs to the existing array
- Bulk selection support: when multiple media items are selected, array fields get all URLs appended; single fields use the first selected image
- Keep existing "Add to Artwork" as one of the content type options

### 3. AI editor context improvements

**File: `src/components/admin/AIChatAssistant.tsx`**

- Enhance the `context` prop handling to include a structured summary of related content. When the component is used in an editor, the parent should pass richer context.
- Add a `relatedContent` optional prop that editors can populate with summaries of existing records from the same table (e.g., titles and descriptions of other life periods when editing a life period).

**File: `src/components/admin/AIGenerateButton.tsx`**

- Expand the `context` object passed to the AI to include existing content from the same table. Before generating, fetch up to 5 recent records from the same content type to give the AI examples of tone, length, and style.
- Add the existing field values of the current record so the AI doesn't generate content that conflicts with what's already written.

**File: `supabase/functions/ai-assistant/index.ts`**

- Update the system prompt to instruct the AI to reference existing content when provided, maintaining consistency in tone and avoiding duplication.

### 4. Additional gaps found

**File: `src/components/admin/ContentSuggestions.tsx`**
- The `CONTENT_FIELDS` check for `image_url` on tables like `artwork` (which always has `image_url` populated) generates zero suggestions -- but the query still fetches those columns unnecessarily, adding latency.

**File: `src/pages/admin/ContentHub.tsx`**
- The `suggestionsCount` query at lines 79-104 runs its own separate set of queries against 4 tables, completely independent of the actual suggestions. This means the badge count doesn't match the actual number of suggestions shown. Fix: derive count from the real suggestions query.

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/admin/ContentSuggestions.tsx` | Fix SELECT queries per-table, add refresh button, expose refetch |
| `src/pages/admin/ContentHub.tsx` | Add refresh button, remove duplicate suggestions count query, derive count from real data |
| `src/pages/admin/MediaLibrary.tsx` | Replace "Add to Artwork" with "Add to Content" supporting all content types with record selection |
| `src/components/admin/AIGenerateButton.tsx` | Fetch sibling content for context before generating |
| `src/components/admin/AIChatAssistant.tsx` | Accept and pass richer context including related records |
| `supabase/functions/ai-assistant/index.ts` | Update system prompt to reference existing content |

