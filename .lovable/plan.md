

# Comprehensive Feature Enhancement Plan

## Overview

This plan addresses 8 major feature requests requiring new database tables, admin management pages, public pages, and data imports. Due to the scope, I'll organize this into logical implementation phases.

---

## Phase 1: Product Data Import

### 1.1 Import CompteHaus Products from Etsy PDF

The uploaded PDF `EtsyListingsDownload_1.pdf` needs to be parsed for product data. I'll extract the product information and add it to:

**A) experiment_products table (linked to CompteHaus experiment)**
- Products with full details (name, price, description, images, SKU, etc.)
- Link to experiment_id for CompteHaus (`cfee45f2-9977-4d54-8e6a-7412d8fa4371`)

**B) products table (Store)**
- Replace current store products with the CompteHaus inventory
- Status set to active for store display

### 1.2 GlucoHaus Clarification

Update the GlucoHaus experiment record to clearly indicate it was pre-planning only:
- Update description to emphasize "Concept & Pre-Planning Phase - No Launch"
- Update status field and add banner indicator
- Add note about no branding/no actual products sold

---

## Phase 2: Content Library with Publishing Workflow

### 2.1 Database Changes

The existing content review system supports scheduling. Add a unified content library view.

**Enhance existing tables:**
- articles, updates already have `scheduled_at`, `review_status`, `published` fields
- Add a unified dashboard to manage all content types

### 2.2 New Admin Page: Content Library

**File: `src/pages/admin/ContentLibrary.tsx`**

Features:
- Combined view of all content types (articles, updates, experiments, projects)
- Filter by content type, status, scheduled date
- Actions: Edit, Schedule Publish, Publish Now, Unpublish, Delete
- Quick status indicators (Draft, Scheduled, Published)
- Calendar view for scheduled content

```
+------------------------------------------------------------------+
| Content Library                                                    |
+------------------------------------------------------------------+
| [+ New Article] [+ New Update] [+ New Project]                    |
|                                                                    |
| Filter: [All Types ▼] [All Status ▼] [Date Range]                 |
|                                                                    |
| +------------------+----------+----------+------------+--------+  |
| | Title            | Type     | Status   | Scheduled  | Actions|  |
| +------------------+----------+----------+------------+--------+  |
| | My New Article   | Article  | Draft    | --         | [...]  |  |
| | Weekly Update    | Update   | Scheduled| Feb 10     | [...]  |  |
| | Project Launch   | Project  | Published| --         | [...]  |  |
| +------------------+----------+----------+------------+--------+  |
+------------------------------------------------------------------+
```

### 2.3 Route Addition

Add to App.tsx:
```typescript
<Route path="/admin/content-library" element={<ContentLibrary />} />
```

---

## Phase 3: Experience Section (Past Experiences)

### 3.1 Database: Create `experiences` Table

```sql
CREATE TABLE experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'creative', 'business', 'technical', 'service'
  subcategory TEXT, -- more specific categorization
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  
  -- Time period
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN DEFAULT false,
  
  -- Skills and tools
  skills_used TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  
  -- Outcomes
  key_achievements TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  challenges_overcome TEXT[] DEFAULT '{}',
  
  -- Metrics (when applicable)
  clients_served INTEGER,
  revenue_generated NUMERIC(10,2),
  projects_completed INTEGER,
  
  -- Admin
  admin_notes TEXT,
  order_index INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Sample Experience Categories

Based on your request, here are the experience entries to create:

| Category | Subcategory | Experiences |
|----------|-------------|-------------|
| Creative | Visual Art | Acrylic painting, Pencil/sketch, Clay/sculpture, Ceramics, Image/print transfer |
| Creative | Design | Graphic design, Product design, Logo design |
| Creative | Writing | Non-fiction, Fiction, Children's literature, Editorial |
| Business | E-commerce | Etsy, Shopify, eBay (antique furniture), Independent shops |
| Business | Operations | Inventory management, Shipping/delivery, Cost/profit analysis, Accounting |
| Business | Marketing | Google Ads, Google Analytics, Content production |
| Technical | Web Dev | Wix, Lovable, Python, Stripe integration |
| Technical | Analysis | SWOT analysis, UX/product analysis, Customer experience |
| Service | Tutoring | High school/middle school tutoring |
| Service | Notary | Independent notary services |
| Service | Health | T1D advocacy, Mentoring/support |
| Other | Horticulture | Planting, growing, plant care |
| Other | Restoration | Antique furniture refinishing |
| Other | Research | Deep research and analysis |

### 3.3 Admin Pages

**Files to create:**
- `src/pages/admin/ExperiencesManager.tsx` - List and manage experiences
- `src/pages/admin/ExperienceEditor.tsx` - Add/edit experience

### 3.4 Public Page

**File: `src/pages/Experiences.tsx`**

Layout similar to FuturePlans but for past experiences:
- Category filters (Creative, Business, Technical, Service)
- Timeline/card view of experiences
- Detail pages showing full information

---

## Phase 4: Certifications Section

### 4.1 Database: Create `certifications` Table

```sql
CREATE TABLE certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL, -- "Google", "AWS", "Coursera"
  category TEXT, -- 'technical', 'creative', 'business', 'health'
  description TEXT,
  image_url TEXT, -- certificate image or issuer logo
  
  -- Status
  status TEXT DEFAULT 'planned', -- 'earned', 'in_progress', 'planned', 'wanted'
  earned_date DATE,
  expiration_date DATE,
  credential_url TEXT, -- link to verify
  credential_id TEXT,
  
  -- Funding (for sponsorship)
  estimated_cost NUMERIC(10,2),
  funded_amount NUMERIC(10,2) DEFAULT 0,
  funding_enabled BOOLEAN DEFAULT true,
  
  -- Skills covered
  skills TEXT[] DEFAULT '{}',
  
  -- Admin
  admin_notes TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Admin Pages

**Files:**
- `src/pages/admin/CertificationsManager.tsx`
- `src/pages/admin/CertificationEditor.tsx`

### 4.3 Public Page

**File: `src/pages/Certifications.tsx`**

Layout:
- Earned certifications (badges/cards)
- In Progress section with progress bars
- Planned/Wanted section with sponsorship option
- "Sponsor This Certification" button linking to Support page

---

## Phase 5: Project Financial Tracking

### 5.1 Database: Enhance `projects` Table

The table already has `money_spent`, `money_needed`, `funding_goal`, `funding_raised`. Add:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS 
  expenses JSONB DEFAULT '[]', -- Array of {category, description, amount, date}
  income_data JSONB DEFAULT '{}', -- {revenue: 0, sources: [], user_count: 0}
  analytics_notes TEXT;
```

### 5.2 Update ProjectEditor.tsx

Add new sections:
- **Expenses Tracking**: Add/edit/remove expense items with category, description, amount
- **Income Data**: Revenue, payment sources, user metrics
- **Financial Summary**: Auto-calculated totals

### 5.3 Update ProjectDetail.tsx

Add financial transparency section:
- Display expenses breakdown
- Show income if available
- Total investment vs. returns

---

## Phase 6: Inspirations - Roots Section

### 6.1 Database: Add `is_childhood_root` to favorites

```sql
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS 
  is_childhood_root BOOLEAN DEFAULT false,
  childhood_age_range TEXT, -- "5-8", "9-12", etc.
  childhood_impact TEXT; -- What it instilled
```

### 6.2 Update Inspirations.tsx

Add "Roots" section before or after main inspirations:
- Query favorites where `is_childhood_root = true`
- Display with special styling indicating childhood/formative influence
- Show "What it instilled in me" content

### 6.3 Update FavoriteEditor.tsx

Add checkbox and fields for childhood favorites:
- Is this a childhood/formative favorite?
- Age range when discovered
- What it instilled

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/ContentLibrary.tsx` | Unified content management |
| `src/pages/admin/ExperiencesManager.tsx` | Manage experiences |
| `src/pages/admin/ExperienceEditor.tsx` | Add/edit experience |
| `src/pages/Experiences.tsx` | Public experiences page |
| `src/pages/ExperienceDetail.tsx` | Experience detail page |
| `src/pages/admin/CertificationsManager.tsx` | Manage certifications |
| `src/pages/admin/CertificationEditor.tsx` | Add/edit certification |
| `src/pages/Certifications.tsx` | Public certifications page |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add new routes for experiences, certifications, content library |
| `src/pages/Inspirations.tsx` | Add Roots section |
| `src/pages/admin/FavoriteEditor.tsx` | Add childhood favorite fields |
| `src/pages/admin/ProjectEditor.tsx` | Add financial tracking sections |
| `src/pages/ProjectDetail.tsx` | Display financial breakdown |
| `src/integrations/supabase/types.ts` | Auto-updates with schema changes |

### Database Migrations

| Table | Action |
|-------|--------|
| `experiences` | Create new table |
| `certifications` | Create new table |
| `favorites` | Add childhood root columns |
| `projects` | Add expenses/income JSONB columns |

### Data Inserts

1. Parse Etsy PDF and insert products into `experiment_products` and `products`
2. Update GlucoHaus experiment with clarification text
3. Sample experiences based on listed skills
4. Childhood roots favorites (if provided)

---

## Implementation Order

1. **Database migrations** - Create new tables and alter existing
2. **Parse Etsy PDF** - Extract and import product data
3. **Update GlucoHaus** - Clarify pre-planning status
4. **Content Library** - Build unified content management
5. **Experiences** - Create admin and public pages
6. **Certifications** - Create admin and public pages with funding
7. **Project Financials** - Enhance editor and detail pages
8. **Inspirations Roots** - Add childhood favorites section

---

## Technical Notes

### RLS Policies

All new tables will have:
- Public read access for published content
- Admin-only write access via `has_role(auth.uid(), 'admin')`

### Navigation Updates

Add to admin sidebar and public header:
- Experiences link
- Certifications link
- Content Library (admin only)

### Routing

New routes to add to App.tsx:
```typescript
// Public
<Route path="/experiences" element={<Experiences />} />
<Route path="/experiences/:slug" element={<ExperienceDetail />} />
<Route path="/certifications" element={<Certifications />} />

// Admin
<Route path="/admin/content-library" element={<ContentLibrary />} />
<Route path="/admin/experiences" element={<ExperiencesManager />} />
<Route path="/admin/experiences/new" element={<ExperienceEditor />} />
<Route path="/admin/experiences/:id/edit" element={<ExperienceEditor />} />
<Route path="/admin/certifications" element={<CertificationsManager />} />
<Route path="/admin/certifications/new" element={<CertificationEditor />} />
<Route path="/admin/certifications/:id/edit" element={<CertificationEditor />} />
```

