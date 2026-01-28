

# Comprehensive Feature Implementation Plan

## Overview

This plan implements 12 major features across new pages, database tables, admin functionality, and content management without modifying or removing any existing content or features.

---

## Part 1: Current Focus Section

### What It Does
Display the artist's current focus area with timeline context (Dec 2023 - Sep 2025: Art & Stickers, Sep 2025+: Web/App Development)

### Database Changes
Add to `site_content` table using section keys:
- `current_focus_title`
- `current_focus_description`
- `focus_timeline` (JSON array of focus periods)

### Changes Needed
- **Update `src/pages/Index.tsx`**: Add "Current Focus" section showing active work area
- **Update `src/pages/admin/HomeContent.tsx`**: Add current focus editor with timeline periods

### Sales Data
Add `sales_data` table:
```text
- id (uuid)
- period (text) - e.g., "2024-Q1"
- category (text) - e.g., "stickers", "art", "commissions"
- amount (numeric)
- units_sold (integer)
- notes (text)
- created_at (timestamptz)
```

---

## Part 2: Work Timeline & Time Logging

### Database Changes
Create `work_logs` table:
```text
- id (uuid)
- project_id (uuid, FK to projects, nullable)
- date (date)
- hours (numeric)
- description (text)
- category (text) - e.g., "development", "design", "research"
- week_number (integer)
- year (integer)
- created_at (timestamptz)
```

### New Admin Page
**`src/pages/admin/TimeTracker.tsx`**
- Weekly calendar view
- Log time entries per project
- Hours summary by week/month
- Project time breakdown

### Public Display
- Add work timeline section to About page or dedicated Timeline page
- Show weekly activity summary

---

## Part 3: Fund Development Project Selection

### Changes Needed
**Update `src/pages/admin/FundingCampaignsManager.tsx`** (new page):
- CRUD for funding campaigns
- Dropdown to select projects filtered by `status = 'in_progress'` OR `status = 'planned'`
- Link campaigns to projects

**Update `src/pages/Support.tsx`**:
- Show project name for each development campaign
- Display project status alongside funding info

---

## Part 4: Project Cost Tracking & Funding

### Database Changes
Add columns to `projects` table:
```text
- money_spent (numeric)
- money_needed (numeric)
- cost_breakdown (jsonb) - e.g., {"hosting": 50, "design": 200}
```

### Changes Needed
**Update `src/pages/admin/ProjectEditor.tsx`**:
- Add "Financials" section
- Money spent input
- Money needed input
- Cost breakdown editor

**Update `src/pages/ProjectDetail.tsx`**:
- Add funding progress card if money_needed > 0
- Display cost breakdown
- "Fund This Project" button linking to FundingModal

---

## Part 5: Bulk Artwork Import from Files

### Changes Needed
**Update `src/pages/admin/BulkImport.tsx`**:
- Add "artwork_images" content type option
- Support direct image file uploads (multiple)
- For each uploaded image:
  - Auto-generate title from filename
  - Upload to Supabase storage
  - Create artwork record with image URL
  - Allow category selection for batch

### New Feature
- Drag-and-drop zone for multiple image files
- Progress indicator showing upload status
- Preview grid before final import

---

## Part 6: Client Work Section

### Database Changes
Create `client_projects` table:
```text
- id (uuid)
- client_name (text)
- project_name (text)
- slug (text)
- description (text)
- long_description (text)
- image_url (text)
- screenshots (text[])
- tech_stack (text[])
- features (text[])
- status (text) - completed, in_progress
- start_date (date)
- end_date (date)
- testimonial (text)
- testimonial_author (text)
- is_public (boolean) - for NDA projects
- created_at (timestamptz)
- updated_at (timestamptz)
```

### New Pages
**`src/pages/ClientWork.tsx`**:
- Grid layout mirroring Projects.tsx
- Filter by status (completed/in_progress)
- Client name badges
- Testimonial display

**`src/pages/ClientProjectDetail.tsx`**:
- Full project details like ProjectDetail.tsx
- Client testimonial section
- Timeline/duration display

**`src/pages/admin/ClientWorkManager.tsx`**:
- List all client projects
- Edit/delete buttons

**`src/pages/admin/ClientProjectEditor.tsx`**:
- Full form for client project details
- Image upload support

### Navigation Updates
- Add "Client Work" to Header navigation

---

## Part 7: Content I Enjoy (Favorites/Inspirations)

### Database Changes
Create `favorites` table:
```text
- id (uuid)
- title (text)
- type (text) - art, movie, article, research, music, book, creator, other
- source_url (text)
- image_url (text)
- creator_name (text)
- creator_url (text)
- creator_location (text) - continent/country
- description (text)
- impact_statement (text) - how it affected the artist
- is_current (boolean) - for "currently enjoying"
- discovered_date (date)
- tags (text[])
- created_at (timestamptz)
```

### New Pages
**`src/pages/Favorites.tsx`**:
- Filter tabs by type (All, Art, Music, Movies, Articles, Research, Creators)
- Grid/list of favorites
- "Currently Enjoying" highlighted section
- Creator cards with location info
- Music section with current playlist/songs

**`src/pages/FavoriteDetail.tsx`**:
- Full content details
- Impact statement section
- Link to source

**`src/pages/admin/FavoritesManager.tsx`**:
- CRUD for favorites
- Type selection

**`src/pages/admin/FavoriteEditor.tsx`**:
- Form with all fields
- "Import from URL" button that:
  - Fetches og:title, og:image, og:description
  - Populates fields automatically
- "Describe with AI" button to generate impact statement

### Navigation Updates
- Add "Favorites" to Header navigation

---

## Part 8: Inspirations Page

### Database Changes
Create `inspirations` table:
```text
- id (uuid)
- title (text) - e.g., "Bret Helquist", "Society & Struggle"
- category (text) - person, concept, movement, experience
- description (text)
- detailed_content (text) - rich text
- image_url (text)
- related_links (jsonb) - [{ title, url }]
- influence_areas (text[]) - e.g., ["art style", "philosophy"]
- order_index (integer)
- created_at (timestamptz)
```

### New Pages
**`src/pages/Inspirations.tsx`**:
- Hero section explaining what inspires
- Grid of inspiration cards
- Category filter (People, Concepts, Movements, Experiences)
- Detailed expandable descriptions

**`src/pages/InspirationDetail.tsx`**:
- Full content with rich text
- Related links section
- Influence areas tags

**`src/pages/admin/InspirationsManager.tsx`**:
- CRUD for inspirations
- Drag-and-drop ordering

**`src/pages/admin/InspirationEditor.tsx`**:
- Full form with rich text editor
- Image upload
- Related links editor

### Navigation Updates
- Add "Inspirations" to Header (possibly under About dropdown or separate)

---

## Part 9: Life Periods/Themes Timeline

### Database Changes
Create `life_periods` table:
```text
- id (uuid)
- title (text) - e.g., "The Discovery Years", "Art Awakening"
- start_date (date)
- end_date (date, nullable)
- description (text)
- detailed_content (text)
- themes (text[]) - e.g., ["growth", "struggle", "transformation"]
- key_works (uuid[]) - references to artwork/projects
- image_url (text)
- is_current (boolean)
- order_index (integer)
- created_at (timestamptz)
```

### New Pages
**`src/pages/LifeTimeline.tsx`**:
- Vertical timeline visualization
- Period cards with date ranges
- Theme tags
- Links to related artwork/projects
- Current period highlighted

**`src/pages/LifePeriodDetail.tsx`**:
- Full period content
- Gallery of key works from that period
- Theme exploration

**`src/pages/admin/LifePeriodsManager.tsx`**:
- CRUD for life periods
- Timeline preview

**`src/pages/admin/LifePeriodEditor.tsx`**:
- Full form
- Key works selector (from artwork/projects)

### Navigation Updates
- Add "Timeline" or "Life & Art" to navigation

---

## Part 10: Admin Layout Updates

**Update `src/components/admin/AdminLayout.tsx`**:
Add new navigation items:
```typescript
// Under Content section:
{ label: "Client Work", href: "/admin/client-work", icon: Briefcase },
{ label: "Favorites", href: "/admin/favorites", icon: Heart },
{ label: "Inspirations", href: "/admin/inspirations", icon: Sparkles },
{ label: "Life Periods", href: "/admin/life-periods", icon: History },
{ label: "Sales Data", href: "/admin/sales", icon: DollarSign },
{ label: "Time Tracker", href: "/admin/time-tracker", icon: Clock },
{ label: "Funding Campaigns", href: "/admin/funding-campaigns", icon: TrendingUp },
```

---

## Part 11: Navigation Updates

**Update `src/components/layout/Header.tsx`**:
Add new navigation items:
```typescript
{ label: "Client Work", href: "/client-work" },
{ label: "Favorites", href: "/favorites" },
{ label: "Inspirations", href: "/inspirations" },
{ label: "Timeline", href: "/timeline" },
```

---

## Part 12: Route Updates

**Update `src/App.tsx`**:
Add all new routes:

```typescript
// Public routes
<Route path="/client-work" element={<ClientWork />} />
<Route path="/client-work/:slug" element={<ClientProjectDetail />} />
<Route path="/favorites" element={<Favorites />} />
<Route path="/favorites/:id" element={<FavoriteDetail />} />
<Route path="/inspirations" element={<Inspirations />} />
<Route path="/inspirations/:id" element={<InspirationDetail />} />
<Route path="/timeline" element={<LifeTimeline />} />
<Route path="/timeline/:id" element={<LifePeriodDetail />} />

// Admin routes
<Route path="/admin/client-work" element={<ClientWorkManager />} />
<Route path="/admin/client-work/new" element={<ClientProjectEditor />} />
<Route path="/admin/client-work/:id/edit" element={<ClientProjectEditor />} />
<Route path="/admin/favorites" element={<FavoritesManager />} />
<Route path="/admin/favorites/new" element={<FavoriteEditor />} />
<Route path="/admin/favorites/:id/edit" element={<FavoriteEditor />} />
<Route path="/admin/inspirations" element={<InspirationsManager />} />
<Route path="/admin/inspirations/new" element={<InspirationEditor />} />
<Route path="/admin/inspirations/:id/edit" element={<InspirationEditor />} />
<Route path="/admin/life-periods" element={<LifePeriodsManager />} />
<Route path="/admin/life-periods/new" element={<LifePeriodEditor />} />
<Route path="/admin/life-periods/:id/edit" element={<LifePeriodEditor />} />
<Route path="/admin/sales" element={<SalesDataManager />} />
<Route path="/admin/time-tracker" element={<TimeTracker />} />
<Route path="/admin/funding-campaigns" element={<FundingCampaignsManager />} />
```

---

## Database Migration Summary

### New Tables (6)
1. `sales_data` - Track sticker/art sales
2. `work_logs` - Time tracking per project
3. `client_projects` - Client work portfolio
4. `favorites` - Content enjoyed (art, music, creators, etc.)
5. `inspirations` - Artist inspirations and influences
6. `life_periods` - Life timeline and themes

### Columns Added to Existing Tables
**projects**:
- `money_spent` (numeric)
- `money_needed` (numeric)
- `cost_breakdown` (jsonb)

---

## Files to Create Summary

### Public Pages (8)
1. `src/pages/ClientWork.tsx`
2. `src/pages/ClientProjectDetail.tsx`
3. `src/pages/Favorites.tsx`
4. `src/pages/FavoriteDetail.tsx`
5. `src/pages/Inspirations.tsx`
6. `src/pages/InspirationDetail.tsx`
7. `src/pages/LifeTimeline.tsx`
8. `src/pages/LifePeriodDetail.tsx`

### Admin Pages (12)
1. `src/pages/admin/ClientWorkManager.tsx`
2. `src/pages/admin/ClientProjectEditor.tsx`
3. `src/pages/admin/FavoritesManager.tsx`
4. `src/pages/admin/FavoriteEditor.tsx`
5. `src/pages/admin/InspirationsManager.tsx`
6. `src/pages/admin/InspirationEditor.tsx`
7. `src/pages/admin/LifePeriodsManager.tsx`
8. `src/pages/admin/LifePeriodEditor.tsx`
9. `src/pages/admin/SalesDataManager.tsx`
10. `src/pages/admin/TimeTracker.tsx`
11. `src/pages/admin/FundingCampaignsManager.tsx`

---

## Files to Modify Summary

1. `src/pages/Index.tsx` - Add Current Focus section
2. `src/pages/admin/HomeContent.tsx` - Add current focus editor
3. `src/pages/admin/ProjectEditor.tsx` - Add Financials section
4. `src/pages/ProjectDetail.tsx` - Add cost/funding display
5. `src/pages/admin/BulkImport.tsx` - Add artwork image upload
6. `src/pages/Support.tsx` - Show project names in campaigns
7. `src/components/layout/Header.tsx` - Add new nav items
8. `src/components/admin/AdminLayout.tsx` - Add new admin nav items
9. `src/App.tsx` - Add all new routes

---

## Implementation Order

### Phase 1: Database Setup
1. Create all new tables with RLS policies
2. Add columns to projects table

### Phase 2: Core Admin Infrastructure
3. Create FundingCampaignsManager
4. Create TimeTracker
5. Create SalesDataManager
6. Update ProjectEditor with financials

### Phase 3: Client Work Feature
7. Create ClientWork public pages
8. Create ClientWork admin pages

### Phase 4: Favorites & Inspirations
9. Create Favorites public & admin pages
10. Create Inspirations public & admin pages

### Phase 5: Life Timeline
11. Create LifeTimeline public & admin pages

### Phase 6: Integration & Navigation
12. Update BulkImport for artwork images
13. Update Index.tsx with Current Focus
14. Update Header navigation
15. Update AdminLayout navigation
16. Update App.tsx routes
17. Update Support.tsx project display

---

## Technical Summary

| Feature | New Pages | Admin Pages | DB Tables | Modified Files |
|---------|-----------|-------------|-----------|----------------|
| Current Focus | 0 | 0 | 0 | 2 |
| Time Tracking | 0 | 1 | 1 | 0 |
| Fund Development | 0 | 1 | 0 | 1 |
| Project Costs | 0 | 0 | 0 | 2 |
| Bulk Artwork Import | 0 | 0 | 0 | 1 |
| Client Work | 2 | 2 | 1 | 0 |
| Favorites | 2 | 2 | 1 | 0 |
| Inspirations | 2 | 2 | 1 | 0 |
| Life Periods | 2 | 2 | 1 | 0 |
| Sales Data | 0 | 1 | 1 | 0 |
| Navigation | 0 | 0 | 0 | 3 |

**Totals**: 8 new public pages + 11 new admin pages + 6 new tables + 9 modified files

