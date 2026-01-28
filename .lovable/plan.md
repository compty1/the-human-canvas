
# Comprehensive Feature Implementation Plan

## Overview

This plan addresses all requested features to achieve full functionality across funding, AI-powered analysis, GitHub integration, image uploads, supplies marketplace, and admin content synchronization.

---

## Part 1: Image Upload Support for Screenshots

### Current State
- `ImageUploader` and `MultiImageUploader` components already exist and work correctly
- Already integrated into `ProjectEditor`, `ArtworkEditor`, and `ProductReviewEditor`

### Required Fixes
**Issue**: The `analyze-site` edge function doesn't automatically capture screenshots

**Solution**: Create a new edge function to capture screenshots from URLs

**New Edge Function: `capture-screenshots/index.ts`**
- Accept a URL parameter
- Use a headless browser service (or screenshot API) to capture page screenshots
- Upload captured images to Supabase storage
- Return array of screenshot URLs

**Update `ProjectEditor.tsx`**
- Add "Auto-Capture Screenshots" button next to URL analyzer
- Call the new edge function to pull screenshots automatically
- Merge captured screenshots with existing ones

---

## Part 2: Development Funding Feature

### Database Changes
Create new table `funding_campaigns`:
```text
funding_campaigns
- id (uuid)
- campaign_type (enum: 'development', 'research', 'supplies')
- title (text)
- description (text)
- target_amount (numeric)
- raised_amount (numeric, default 0)
- project_id (uuid, nullable, FK to projects)
- status (enum: 'active', 'paused', 'completed')
- created_at (timestamptz)
- updated_at (timestamptz)
```

Create enum `funding_campaign_type`:
- 'development' - Fund project programming/development
- 'research' - Fund research for project development  
- 'supplies' - Fund supplies/equipment needed

### New Components

**src/components/funding/DevelopmentFundingCard.tsx**
- Displays project with funding goal and progress
- "Fund Development" button
- Shows what development milestones the funding enables

**src/components/funding/FundingModal.tsx**
- Reusable modal for funding contribution
- Amount selection (preset + custom)
- Optional message
- Stripe payment integration placeholder
- Save to `contributions` table with type

### Update Pages

**src/pages/Support.tsx**
- Add new "Fund Development" section
- Pull projects with `funding_goal > 0` from database
- Display funding progress bars
- Link to detail pages for more info

**src/pages/ProjectDetail.tsx**
- Add "Fund This Project's Development" card
- Show funding milestones/goals
- Direct contribution option

---

## Part 3: Fund Research Feature

### Implementation
Uses same `funding_campaigns` table with `campaign_type = 'research'`

### New Components

**src/components/funding/ResearchFundingCard.tsx**
- Research topic/goal display
- Funding progress
- What research outcomes will be produced

### Update Pages

**src/pages/Support.tsx**
- Add "Fund Research" section alongside existing options
- List active research funding campaigns
- Show research goals and expected outcomes

**src/pages/admin/ResearchFundingManager.tsx**
- CRUD for research funding campaigns
- Set research goals and descriptions
- Track funding progress

---

## Part 4: Supplies Needed Section

### Database Changes
Create new table `supplies_needed`:
```text
supplies_needed
- id (uuid)
- name (text)
- description (text)
- image_url (text)
- product_url (text) - Link to buy the product
- price (numeric)
- funded_amount (numeric, default 0)
- priority (enum: 'high', 'medium', 'low')
- category (text) - e.g., 'Equipment', 'Software', 'Materials'
- status (enum: 'needed', 'partially_funded', 'funded', 'purchased')
- created_at (timestamptz)
```

### New Pages

**src/pages/Supplies.tsx**
Public-facing supplies wishlist page:
- Grid of needed supplies with images
- Each item shows:
  - Product name and description
  - Price and funding progress
  - "Buy for Shane" button → Links to product page OR opens donation modal
  - "Donate Toward This" button → Partial contribution
- Categories filter (Equipment, Software, Materials)
- Priority badges

**src/pages/admin/SuppliesManager.tsx**
Admin page to manage supplies:
- Add new supply items
- Set price, priority, category
- Upload product image
- Add purchase link
- Mark as purchased when received

### Update Navigation

**src/components/layout/Header.tsx**
- Add "Supplies" link to Support dropdown or as separate nav item

**src/App.tsx**
- Add routes: `/supplies`, `/admin/supplies`

---

## Part 5: Admin Content Synchronization

### Issue Analysis
Current `ArtGallery.tsx` uses hardcoded local image imports instead of database

### Solution

**Update `src/pages/ArtGallery.tsx`**
- Fetch artwork from `artwork` table instead of hardcoded array
- Keep local images as fallback for items not in DB
- Merge database artwork with local artwork
- Category filter reads from both sources

**Database Seed Migration**
- Insert existing local artwork into `artwork` table
- Map each local image to a Supabase storage URL or keep as static import path

**Update Admin Artwork Flow**
- When new artwork is uploaded via `ArtworkEditor`:
  - Image goes to Supabase storage
  - Record created in `artwork` table
  - Automatically appears in `ArtGallery`

**Ensure All Content Tables Have Admin Pages**
Currently missing managers for:
- Articles (need `/admin/articles` list view)
- Updates (need `/admin/updates` list view)

**Create `src/pages/admin/ArticlesManager.tsx`**
- List all articles with status, category, dates
- Edit/delete buttons
- "New Article" button

**Create `src/pages/admin/UpdatesManager.tsx`**
- List all updates with publish status
- Edit/delete buttons
- "New Update" button

---

## Part 6: AI-Powered UX Reviews

### New Edge Function: `analyze-product/index.ts`

**Functionality**:
- Accept product URL
- Scrape product page for information
- Use AI to analyze:
  - User experience aspects
  - Potential pain points
  - Technical considerations
  - Improvement suggestions
  - Strengths and weaknesses
- Return structured data matching `product_reviews` table schema

**Implementation**:
```typescript
// Fetches product page
// Extracts metadata, reviews from page if available
// Sends to AI for comprehensive UX analysis
// Returns:
{
  product_name: string,
  company: string,
  category: string,
  overall_rating: number,
  summary: string,
  pain_points: string[],
  strengths: string[],
  technical_issues: string[],
  improvement_suggestions: string[],
  future_recommendations: string[],
}
```

### Update `ProductReviewEditor.tsx`
- Add "Auto-Analyze Product" section at top
- URL input field
- "Analyze with AI" button
- On success, populate all form fields
- Allow manual editing after auto-fill

---

## Part 7: Auto-Screenshot Capture for Projects

### New Edge Function: `capture-screenshots/index.ts`

**Approach**: Use a screenshot service or scraping technique
- Option A: Use screenshot.guru API or similar
- Option B: Extract og:image and other meta images from page
- Option C: Use Browserless.io or Puppeteer service

**For MVP**: Extract all images from the page that look like screenshots
```typescript
// Scrape page HTML
// Find og:image, twitter:image, main content images
// Filter out tiny icons and logos
// Return array of image URLs
```

### Update `ProjectEditor.tsx`
- Add "Capture Screenshots" button
- Show loading state during capture
- Preview captured screenshots before adding
- Allow selection of which screenshots to include

---

## Part 8: Enhanced Project Content

### Update `analyze-site/index.ts`
Enhance AI prompt to extract more details:
- Build process information
- Architecture details
- Performance considerations
- Accessibility features
- Mobile responsiveness
- Security features
- API integrations used
- Deployment information

### Add New Fields to `ProjectEditor.tsx`
- Architecture notes
- Performance metrics
- Accessibility score/notes
- Mobile considerations
- API integrations list
- Deployment info

### Update `ProjectDetail.tsx`
- Display all new fields in organized sections
- Architecture diagram placeholder
- Performance metrics display
- Accessibility badges

---

## Part 9: GitHub Project Import

### New Edge Function: `analyze-github/index.ts`

**Accepts**: GitHub repository URL

**Extracts from GitHub API**:
- Repository name and description
- README.md content
- Languages used
- Dependencies (from package.json)
- Features (from README sections)
- Screenshots (from README images)
- License
- Stars, forks, contributors count
- Last commit date

**AI Enhancement**:
- Generate project description from README
- Extract problem statement from README
- Identify key features from README
- Generate solution summary

**Response Structure**:
```typescript
{
  title: string,
  description: string,
  long_description: string,
  tech_stack: string[],
  features: string[],
  problem_statement: string,
  solution_summary: string,
  screenshots: string[],
  external_url: string, // repo URL
  github_stats: {
    stars: number,
    forks: number,
    contributors: number,
    lastUpdated: string,
  }
}
```

### Update `ProjectEditor.tsx`
- Add "Import from GitHub" section
- GitHub URL input field
- "Analyze Repository" button
- Show GitHub stats badge
- Pull all content and images from repo

---

## Part 10: Database Schema Updates

### New Tables

**funding_campaigns**
```sql
CREATE TABLE funding_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('development', 'research', 'supplies')),
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  raised_amount NUMERIC NOT NULL DEFAULT 0,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE funding_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON funding_campaigns FOR SELECT USING (true);
CREATE POLICY "Admin write" ON funding_campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));
```

**supplies_needed**
```sql
CREATE TABLE supplies_needed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  funded_amount NUMERIC NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'Equipment',
  status TEXT NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'partially_funded', 'funded', 'purchased')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE supplies_needed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON supplies_needed FOR SELECT USING (true);
CREATE POLICY "Admin write" ON supplies_needed FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Update Projects Table
Add new columns:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS 
  architecture_notes TEXT,
  performance_notes TEXT,
  accessibility_notes TEXT,
  github_url TEXT,
  github_stats JSONB;
```

---

## Implementation Order

### Phase 1: Database & Core Infrastructure
1. Create `funding_campaigns` table migration
2. Create `supplies_needed` table migration
3. Add new columns to projects table

### Phase 2: Edge Functions
4. Create `analyze-github/index.ts`
5. Create `analyze-product/index.ts`
6. Create `capture-screenshots/index.ts`
7. Update `analyze-site/index.ts` with enhanced extraction

### Phase 3: Funding Features
8. Create `FundingModal.tsx` component
9. Create `DevelopmentFundingCard.tsx`
10. Create `ResearchFundingCard.tsx`
11. Update `Support.tsx` with new funding sections

### Phase 4: Supplies Section
12. Create `Supplies.tsx` public page
13. Create `SuppliesManager.tsx` admin page
14. Add routes to `App.tsx`
15. Update navigation

### Phase 5: Admin Synchronization
16. Update `ArtGallery.tsx` to fetch from database
17. Create `ArticlesManager.tsx`
18. Create `UpdatesManager.tsx`
19. Seed existing local artwork to database

### Phase 6: AI Analysis Enhancements
20. Update `ProductReviewEditor.tsx` with auto-analyze
21. Update `ProjectEditor.tsx` with GitHub import
22. Update `ProjectEditor.tsx` with screenshot capture
23. Enhance project detail display

### Phase 7: Routes & Navigation
24. Add all new admin routes
25. Update `Header.tsx` navigation
26. Update `AdminLayout.tsx` sidebar

---

## Files to Create

### Edge Functions (4)
1. `supabase/functions/analyze-github/index.ts`
2. `supabase/functions/analyze-product/index.ts`
3. `supabase/functions/capture-screenshots/index.ts`

### Pages (4)
4. `src/pages/Supplies.tsx`
5. `src/pages/admin/SuppliesManager.tsx`
6. `src/pages/admin/ArticlesManager.tsx`
7. `src/pages/admin/UpdatesManager.tsx`

### Components (3)
8. `src/components/funding/FundingModal.tsx`
9. `src/components/funding/DevelopmentFundingCard.tsx`
10. `src/components/funding/ResearchFundingCard.tsx`

### Migrations (1)
11. `supabase/migrations/[timestamp]_funding_and_supplies.sql`

---

## Files to Modify

1. `src/pages/Support.tsx` - Add funding sections
2. `src/pages/ProjectDetail.tsx` - Add funding CTA, enhanced content
3. `src/pages/ArtGallery.tsx` - Fetch from database
4. `src/pages/admin/ProjectEditor.tsx` - GitHub import, screenshot capture
5. `src/pages/admin/ProductReviewEditor.tsx` - AI auto-analyze
6. `src/components/layout/Header.tsx` - Add Supplies nav
7. `src/components/admin/AdminLayout.tsx` - Add new admin sections
8. `src/App.tsx` - Add all new routes
9. `supabase/config.toml` - Register new edge functions
10. `supabase/functions/analyze-site/index.ts` - Enhanced extraction

---

## Technical Summary

| Feature | New Files | Modified Files | Edge Functions |
|---------|-----------|----------------|----------------|
| Image Upload (Screenshots) | 0 | 2 | 1 |
| Development Funding | 3 | 3 | 0 |
| Research Funding | 1 | 2 | 0 |
| Supplies Section | 2 | 3 | 0 |
| Admin Sync | 2 | 1 | 0 |
| AI UX Reviews | 0 | 1 | 1 |
| GitHub Import | 0 | 1 | 1 |
| Enhanced Projects | 0 | 2 | 1 |

**Total**: 11 new files + 10 modified files + 4 edge functions + 1 migration
