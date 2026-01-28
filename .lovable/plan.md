
# Portfolio Enhancement Plan: Photography, Graphic Design, and Blog System

## Overview

This plan adds two new creative categories to your Art Gallery (Photography and Graphic Design/Product Design), imports all your new uploaded artwork, and creates a complete blog system with both "Quick Updates" (short microblog entries) and "Full Articles" (long-form content with a rich text editor).

Your philosophy of viewing culture as "future artifacts of humanity" will be woven into the descriptions, framing each piece as a captured moment of our existence.

---

## Part 1: Expand Art Gallery Categories

### Database Changes

Update the artwork table to support new categories. The current categories are: colored, sketch, mixed. Adding:
- **photography** - Landscape, architectural, street, and documentary photography
- **graphic_design** - Stickers, product designs (mugs, cards), digital graphics

### New Artwork to Add

Copy all 10 uploaded images into the project assets and add to gallery:

| Image | Title | Category | Description |
|-------|-------|----------|-------------|
| Final_Home_Print.png | Golden Hour | photography | The sun descends over rolling hills - a future artifact of light and land |
| 16.png | Sailboat at Dock | photography | Two figures prepare for water - a moment of human activity frozen in time |
| 17.png | Red Brick Cathedral | photography | Architecture tells stories of those who built it |
| 21.png | Venice Palms | photography | Silhouettes reaching skyward - California's iconic sentinels |
| 27.png | Cemetery Stone | photography | A gravestone from 1859 - the most literal artifact of humanity |
| 36.png | Victorian Mansion | photography | Architectural history captured in amber light |
| 38.png | Hollywood Scene | photography | Street culture and belief systems intersecting |
| 97.png | The Anarchist | colored | Pop art portrait with crown and protest - social commentary through bold color |
| 32.png | The Harlequin | colored | Masked identity with heterochromia - the duality of self |
| 37.png | Bandaged Portrait | colored | Expression through imperfection - the beauty in wounds |

### Updated Gallery Filter Bar

```text
[All Work] [Photography] [Colored Digital] [Pencil & Sketch] [Mixed Media] [Graphic Design]
```

---

## Part 2: Quick Updates System (Microblog)

### Purpose
Short-form entries (1-3 paragraphs) for quick thoughts, observations, work-in-progress notes, and brief commentary on topics.

### Database Table: `updates`

```text
+------------+-------------------+
| id         | uuid (PK)         |
| title      | text              |
| content    | text (rich HTML)  |
| excerpt    | text              |
| tags       | text[]            |
| published  | boolean           |
| created_at | timestamp         |
| updated_at | timestamp         |
+------------+-------------------+
```

### Updates Page (`/updates`)
- Hero section with "Quick Updates" branding
- Vertical timeline/feed layout with pop art comic panel cards
- Each update shows: title, excerpt, date, tags, like button
- Click to expand full content in modal or navigate to detail page
- Admin-only: "New Update" button to access editor

### Updates Detail Page (`/updates/:slug`)
- Full update content rendered as rich HTML
- Like button
- Share options
- "More Updates" sidebar with related entries

---

## Part 3: Full Articles System (Long-form Blog)

### Purpose
In-depth articles, essays, and stories with full rich text editing (images, formatting, embeds, etc.).

### Database Updates

The existing `articles` table already has the right structure. Need to:
- Add an `update` category type or keep as separate table (keeping separate is cleaner)
- Ensure `content` column stores rich HTML

### Articles Page (`/articles`)
- Hero section: "Deep Dives & Essays"
- Category filter tabs (Philosophy, Narrative, Cultural, UX Reviews, Research)
- Article cards showing: title, excerpt, category badge, reading time, date, featured image, tags
- Each card links to full article page

### Article Detail Page (`/articles/:slug`)
- Full-width reading experience
- Featured header image with halftone overlay
- Category and reading time badges
- Rich content rendered (headings, images, blockquotes, lists, code blocks)
- Like button and share options
- Related articles section at bottom

---

## Part 4: Rich Text Editor Component

### Technology Choice: Tiptap
Tiptap is a headless rich text editor built on ProseMirror - highly customizable and works great with React/TypeScript. Features:
- Bold, italic, underline, strikethrough
- Headings (H1-H3)
- Bullet and numbered lists
- Blockquotes
- Code blocks
- Image upload and embedding
- Links
- Undo/redo

### Editor Component Features
- Pop art styled toolbar matching site aesthetic
- Image upload to storage bucket
- Preview mode toggle
- Auto-save drafts
- Character/word count
- Keyboard shortcuts

### Admin Editor Pages
- `/admin/updates/new` - Create new update
- `/admin/updates/:id/edit` - Edit existing update
- `/admin/articles/new` - Create new article
- `/admin/articles/:id/edit` - Edit existing article

---

## Part 5: Navigation Updates

### Header Navigation
Current: Art | Projects | Writing | Skills | Future | Support | About

Updated:
```text
Art | Projects | Writing (dropdown) | Skills | Future | Support | About
                    |
                    +-- Updates (Quick Notes)
                    +-- Articles (Full Essays)
```

Or keep flat:
```text
Art | Projects | Updates | Articles | Skills | Future | Support | About
```

### Writing Hub Page (`/writing`)
Transform current Writing page into a hub that showcases both:
- "Latest Updates" section with 3 most recent quick notes
- "Featured Articles" section with top articles
- Links to full Updates and Articles archives

---

## Part 6: Storage Bucket for Images

### Create Storage Bucket
- Bucket name: `content-images`
- Purpose: Store images uploaded through the rich text editor
- Public access for displaying in articles/updates
- RLS policies: Admin can upload, everyone can view

---

## Part 7: Admin Access Control

### Admin Features
- Only users with `admin` role can access editor pages
- Admin dashboard link in header (visible only to admins)
- Publish/unpublish toggle for content
- Edit and delete capabilities

### RLS Policies
- Updates: Everyone can read published, admins can CRUD all
- Articles: Same pattern (already implemented)

---

## Implementation Order

1. **Database Migration** - Create `updates` table, update artwork table categories
2. **Storage Bucket** - Create `content-images` bucket with RLS
3. **Copy New Artwork** - Import all 10 uploaded images to project
4. **Update Art Gallery** - Add new categories and artwork entries
5. **Install Tiptap** - Add tiptap dependencies
6. **Rich Text Editor Component** - Build reusable editor with pop art styling
7. **Updates Pages** - List page, detail page
8. **Articles Pages** - List page, detail page
9. **Admin Editor Pages** - New/edit pages for both content types
10. **Navigation Updates** - Header dropdown or Writing hub
11. **Update Skills Page** - Add Photography and Graphic Design skills

---

## Files to Create/Modify

### New Files
- `src/components/editor/RichTextEditor.tsx` - Tiptap editor component
- `src/components/editor/EditorToolbar.tsx` - Pop art styled toolbar
- `src/pages/Updates.tsx` - Updates listing page
- `src/pages/UpdateDetail.tsx` - Single update view
- `src/pages/Articles.tsx` - Articles listing page
- `src/pages/ArticleDetail.tsx` - Single article view
- `src/pages/admin/UpdateEditor.tsx` - Create/edit updates
- `src/pages/admin/ArticleEditor.tsx` - Create/edit articles

### Modified Files
- `src/pages/ArtGallery.tsx` - Add new categories and artwork
- `src/pages/Writing.tsx` - Transform to hub page
- `src/pages/Skills.tsx` - Add Photography and Graphic Design skills
- `src/components/layout/Header.tsx` - Update navigation
- `src/App.tsx` - Add new routes

### New Assets
- `src/assets/artwork/golden-hour.png`
- `src/assets/artwork/sailboat.png`
- `src/assets/artwork/red-brick.png`
- `src/assets/artwork/venice-palms.png`
- `src/assets/artwork/cemetery-stone.png`
- `src/assets/artwork/victorian-mansion.png`
- `src/assets/artwork/hollywood-scene.png`
- `src/assets/artwork/anarchist.png`
- `src/assets/artwork/harlequin.png`
- `src/assets/artwork/bandaged-portrait.png`

---

## Technical Notes

### Dependencies to Add
- `@tiptap/react` - Core editor
- `@tiptap/starter-kit` - Basic extensions bundle
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text

### Key Design Considerations
- Editor maintains pop art aesthetic with bold borders and color accents
- Content rendering uses prose styling for readability
- Mobile-responsive editor with collapsible toolbar
- Image optimization for uploaded photos
- SEO-friendly article URLs using slugs
