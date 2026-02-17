
# Wire Up AI Content Hub + Suggestions + Interactive Improvements

## Overview

Three major enhancements to make the AI Content Hub the central nerve center for all site content:

1. **Wire to live content and admin sections** -- deep-link from Content Hub to admin editors, show publish status, and let the AI see full content details (not just 5 recent summaries)
2. **Add an AI Suggestions tab** -- automatically analyze live content and surface actionable suggestions (missing descriptions, unpublished drafts, empty fields, SEO gaps, stale content)
3. **Make the chat more interactive** -- quick-action buttons, content type picker, direct "open in editor" links from plan cards, and richer context for the AI

---

## 1. Wire Content Hub to Admin Editors and Live Content

### Content Overview Enhancement (`src/pages/admin/ContentHub.tsx`)
- Each content stat card in the "Content Overview" tab becomes clickable, linking to its admin manager page (e.g., clicking "articles (12)" navigates to `/admin/articles`)
- Add a "published vs draft" breakdown per table where applicable (articles, updates, projects, experiments, product_reviews have `published` boolean)
- Show `review_status` distribution for tables that support it

### Plan Card Deep Links (`src/components/admin/ContentPlanCard.tsx`)
- After a plan is executed, show "Open in Editor" links for each created/updated record
- Map each table to its admin editor route (e.g., `articles` -> `/admin/articles/{id}/edit`, `projects` -> `/admin/projects/{id}/edit`)
- For tables without dedicated editors (skills, favorites), link to the manager page

### Richer Site Context (`src/hooks/useContentActions.ts`)
- Expand `fetchSiteContext()` to include:
  - Published vs unpublished counts per table
  - Records with empty/null descriptions or content
  - Records last updated more than 90 days ago (stale content)
  - This gives the AI much better awareness of what needs attention

---

## 2. AI Suggestions Tab

### New Component: `src/components/admin/ContentSuggestions.tsx`

An automated analysis panel that scans live content and generates actionable suggestions:

**Suggestion categories:**
- **Missing content**: Records with null/empty descriptions, excerpts, or content fields
- **Unpublished drafts**: Content marked `published: false` that could be ready to publish
- **Stale content**: Items not updated in 90+ days
- **Review pending**: Items with `review_status` = "pending_review" or "draft"
- **SEO gaps**: Articles/projects missing tags, excerpts, or featured images
- **Empty tables**: Content types with zero records

**Each suggestion card shows:**
- What the issue is (e.g., "3 articles missing excerpts")
- Affected record names/titles
- Quick action buttons: "Fix with AI" (sends a prompt to the chat), "Open in Editor" (navigates to admin page)

**Integration with chat:**
- "Fix with AI" button pre-populates the chat with a targeted prompt like "Generate excerpts for these 3 articles: [title1], [title2], [title3]"
- The AI then returns a structured plan to update those records

### Add to ContentHub.tsx
- New tab: "Suggestions" with a badge showing the count of actionable items
- Sits alongside "Recent Changes", "Saved Plans", and "Content Overview"

---

## 3. Interactive Chat Improvements

### Quick Action Buttons (`src/components/admin/ContentHubChat.tsx`)
- Add a row of quick-action chips above the input when the chat is empty:
  - "Audit all content" -- asks AI to review everything and suggest improvements
  - "Find missing fields" -- asks AI to identify incomplete records
  - "Generate descriptions" -- asks AI to draft descriptions for records missing them
  - "Publish ready content" -- asks AI to find and publish content in "approved" review status
  - "Content report" -- asks AI for a summary of all content stats

### Content Type Picker for New Content
- When user types "create" or "new", show a dropdown/chip bar of content types (Article, Project, Update, etc.) that pre-fills a structured prompt

### Direct Editor Links in Plan Results
- When a plan executes successfully, each action result shows a clickable link: "View in Editor" that navigates to the appropriate admin editor page

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/admin/ContentSuggestions.tsx` | Suggestions panel component |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/admin/ContentHub.tsx` | Add Suggestions tab, make overview cards clickable with links to admin pages, add published/draft breakdown |
| `src/components/admin/ContentHubChat.tsx` | Add quick-action chips for empty state, content type picker |
| `src/components/admin/ContentPlanCard.tsx` | Add "Open in Editor" links after execution, map tables to admin routes |
| `src/hooks/useContentActions.ts` | Expand `fetchSiteContext()` with richer data (published counts, missing fields, stale content) |
| `supabase/functions/ai-content-hub/index.ts` | Update system prompt to mention suggestions and be aware of publish status / review workflow |

### Admin Route Mapping (used by plan cards and suggestions)
```text
articles     -> /admin/articles/{id}/edit
projects     -> /admin/projects/{id}/edit
updates      -> /admin/updates/{id}/edit
artwork      -> /admin/artwork/{id}/edit
experiments  -> /admin/experiments/{id}/edit
favorites    -> /admin/favorites/{id}/edit
inspirations -> /admin/inspirations/{id}/edit
experiences  -> /admin/experiences/{id}/edit
certifications -> /admin/certifications/{id}/edit
client_projects -> /admin/client-work/{id}/edit
products     -> /admin/products/{id}/edit
product_reviews -> /admin/product-reviews/{id}/edit
life_periods -> /admin/life-periods/{id}/edit
skills       -> /admin/skills
supplies     -> /admin/supplies
```

### Suggestions Query Logic
```text
For each table with 'published' field:
  - Count where published = false -> "X unpublished drafts"
For each table with text fields (description, content, excerpt):
  - Count where field IS NULL or field = '' -> "X records missing {field}"
For each table with 'review_status':
  - Count where review_status = 'pending_review' -> "X items awaiting review"
For each table:
  - Count where updated_at < now() - 90 days -> "X stale items"
```

No database changes required. All data already exists in the current schema.
