
# Comprehensive Implementation Plan

## Overview
This plan addresses all requested features: admin navigation visibility for admins, user profile page, experiments/business showcase, bulk text AI import (up to 30,000 characters), project logos from URLs, multi-file upload verification, Shopify store preparation, and ensuring all content is visible and manageable in admin panels.

---

## Part 1: Admin Navigation for Logged-In Admins (CRITICAL FIX)

### Problem
When an admin signs in, there is no visible navigation link to access the admin panel from the main site header. The admin must manually navigate to `/admin`.

### Solution
Update `Header.tsx` to:
1. Import useQuery from @tanstack/react-query
2. Check if user has admin role using `has_role` RPC function
3. Conditionally render "Admin" button/link for admins only (never for non-admins)

### Files to Modify
- `src/components/layout/Header.tsx`

### Implementation
```typescript
// Add import
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

// Inside Header component, after useAuth:
const { data: isAdmin } = useQuery({
  queryKey: ["is-admin-header", user?.id],
  queryFn: async () => {
    if (!user) return false;
    const { data } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    return data;
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000,
});

// In JSX - add Admin link before Profile (desktop):
{isAdmin && (
  <Link to="/admin" className="flex items-center gap-2 px-3 py-2 bg-pop-yellow border-2 border-foreground hover:bg-pop-yellow/80">
    <Settings className="w-4 h-4" />
    <span className="font-bold text-sm">Admin</span>
  </Link>
)}

// Same for mobile menu
```

---

## Part 2: User Profile Page

### What It Does
Allow users to view and manage their profile (display name, avatar).

### Database
The `profiles` table already exists with: `id`, `user_id`, `display_name`, `avatar_url`, `show_on_thank_you_wall`

### New Files
- `src/pages/Profile.tsx`

### Routes to Add
```typescript
<Route path="/profile" element={<Profile />} />
```

### Profile Page Features
- Display email (from auth)
- Edit display name
- Upload avatar
- Toggle show on thank you wall
- View contribution history (if any)

---

## Part 3: Experiments/Business Ventures Page

### What It Does
Showcase previous business ventures (e.g., CompteHaus on Etsy) with full business operation details.

### Database Changes
Create new `experiments` table:
```sql
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL, -- "Etsy", "Shopify", "Independent"
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'sold')),
  -- Financials
  revenue NUMERIC DEFAULT 0,
  costs NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  cost_breakdown JSONB DEFAULT '{}',
  -- Metrics
  products_sold INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_rating NUMERIC,
  review_count INTEGER DEFAULT 0,
  -- Content
  sample_reviews TEXT[],
  products_offered TEXT[],
  skills_demonstrated TEXT[],
  lessons_learned TEXT[],
  management_info TEXT,
  operation_details TEXT,
  -- Meta
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.experiments FOR SELECT USING (true);
CREATE POLICY "Admin write" ON public.experiments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### New Pages
1. `src/pages/Experiments.tsx` - Public grid view of business ventures
2. `src/pages/ExperimentDetail.tsx` - Individual experiment with full details
3. `src/pages/admin/ExperimentsManager.tsx` - Admin list with CRUD
4. `src/pages/admin/ExperimentEditor.tsx` - Full form with all fields

### Navigation Updates
- Add "Experiments" to `Header.tsx` navigation
- Add "Experiments" to `AdminLayout.tsx` sidebar under Content section

---

## Part 4: Bulk Text Import with AI Analysis (30,000 Characters)

### What It Does
Allow pasting large amounts of text that gets analyzed by AI to auto-fill all form fields. Supports up to 30,000 characters.

### New Component
- `src/components/admin/BulkTextImporter.tsx`

### Component Features
```typescript
interface BulkTextImporterProps {
  contentType: 'project' | 'product_review' | 'experiment' | 'article' | 'client_project' | 'favorite' | 'inspiration';
  onImport: (data: Record<string, unknown>) => void;
}
```
- Large multiline textarea with maxLength={30000}
- Live character counter showing X/30,000
- "Analyze & Auto-Fill" button
- Loading state with spinner
- Error handling with toast notifications

### Edge Function Update
Update `supabase/functions/generate-copy/index.ts`:
- Add new `bulk_import` type that accepts long text
- Use tool calling to return structured JSON matching form fields
- Create field mappings for each content type

### Integration Points
Add BulkTextImporter component to:
1. `ProjectEditor.tsx`
2. `ProductReviewEditor.tsx`
3. `ExperimentEditor.tsx` (new)
4. `ArticleEditor.tsx`
5. `ClientProjectEditor.tsx`
6. `FavoriteEditor.tsx`
7. `InspirationEditor.tsx`

---

## Part 5: Project Logo from URL

### What It Does
Extract favicon/logo from project URLs and display alongside project details.

### Database Changes
```sql
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

### Edge Function Update
Update `supabase/functions/analyze-site/index.ts` to extract logos:
```typescript
// Priority order for logo detection:
// 1. apple-touch-icon (highest quality)
// 2. og:image (if appears to be a logo)
// 3. Standard favicon link rel="icon"
// 4. Fallback to /favicon.ico

const logoMatch = html.match(/<link[^>]*rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
```

### ProjectEditor Updates
- Add logo_url field with ImageUploader
- Auto-populate from analyze-site result
- Show preview of extracted logo

### Display Updates
Update project display components:
- `Projects.tsx` - Show logo next to project title
- `ProjectDetail.tsx` - Display logo in header
- Admin project lists - Show logo thumbnail

---

## Part 6: Multi-File Upload Verification

### Current State
`MultiImageUploader` component exists and supports `multiple` attribute for selecting multiple files.

### Verification Checklist
Ensure all these editors use `MultiImageUploader` for gallery fields:
- `ProjectEditor.tsx` - screenshots ✓
- `ProductReviewEditor.tsx` - screenshots (verify)
- `ClientProjectEditor.tsx` - screenshots (verify)
- `ExperimentEditor.tsx` - screenshots (new, add)
- `ArtworkEditor.tsx` - single image (appropriate)
- `FavoriteEditor.tsx` - single image (appropriate)
- `BulkImport.tsx` - multi-file import for artwork

All gallery uploads should allow selecting multiple files at once.

---

## Part 7: Shopify Store Preparation

### What It Does
Prepare the infrastructure for Shopify integration (user mentioned $5 Shopify plan, will integrate later).

### Database Changes
Create `products` table for store items:
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  inventory_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  shopify_product_id TEXT, -- For later Shopify sync
  shopify_variant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Admin write" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### New Pages
1. `src/pages/Store.tsx` - Public store/shop page
2. `src/pages/ProductDetail.tsx` - Individual product page (placeholder for now)
3. `src/pages/admin/ProductsManager.tsx` - Admin product list
4. `src/pages/admin/ProductEditor.tsx` - Admin product editor

### Note
Cart and checkout functionality will be added when Shopify is connected. For now:
- Products display with "Coming Soon" or link to external purchase
- Admin can manage products in preparation for Shopify sync

---

## Part 8: Ensure All Content is Visible and Manageable in Admin

### Current Database Tables to Admin Page Mapping

| Table | Admin Page | Status |
|-------|-----------|--------|
| projects | ProjectsManager | ✓ Exists |
| articles | ArticlesManager | ✓ Exists |
| updates | UpdatesManager | ✓ Exists |
| artwork | ArtworkManager | ✓ Exists |
| product_reviews | ProductReviewsManager | ✓ Exists |
| skills | SkillsManager | ✓ Exists |
| learning_goals | LearningGoalsManager | ✓ Exists |
| client_projects | ClientWorkManager | ✓ Exists |
| favorites | FavoritesManager | ✓ Exists |
| inspirations | InspirationsManager | ✓ Exists |
| life_periods | LifePeriodsManager | ✓ Exists |
| supplies_needed | SuppliesManager | ✓ Exists |
| funding_campaigns | FundingCampaignsManager | ✓ Exists |
| sales_data | SalesDataManager | ✓ Exists |
| work_logs | TimeTracker | ✓ Exists |
| admin_notes | NotesManager | ✓ Exists |
| site_content | SiteContent, HomeContent, AboutContent | ✓ Exists |
| leads | LeadFinder | ✓ Exists |
| contributions | Missing | Need to add |
| experiments | Missing | Adding in Part 3 |
| products | Missing | Adding in Part 7 |

### New Admin Pages Needed
1. `src/pages/admin/ContributionsManager.tsx` - View and manage user contributions/donations

### Admin Layout Updates
Add new items to sidebar:
```typescript
{ label: "Experiments", href: "/admin/experiments", icon: Beaker },
{ label: "Products", href: "/admin/products", icon: ShoppingBag },
{ label: "Contributions", href: "/admin/contributions", icon: Gift },
```

---

## Files Summary

### New Files (13)
1. `src/pages/Profile.tsx` - User profile page
2. `src/pages/Experiments.tsx` - Public experiments list
3. `src/pages/ExperimentDetail.tsx` - Experiment detail page
4. `src/pages/admin/ExperimentsManager.tsx` - Admin experiments list
5. `src/pages/admin/ExperimentEditor.tsx` - Admin experiment editor
6. `src/pages/Store.tsx` - Public store page
7. `src/pages/ProductDetail.tsx` - Product detail page
8. `src/pages/admin/ProductsManager.tsx` - Admin products list
9. `src/pages/admin/ProductEditor.tsx` - Admin product editor
10. `src/pages/admin/ContributionsManager.tsx` - Admin contributions view
11. `src/components/admin/BulkTextImporter.tsx` - Reusable bulk text AI import

### Files to Modify (13)
1. `src/components/layout/Header.tsx` - Add admin link for admins, add Experiments and Store to nav
2. `src/components/admin/AdminLayout.tsx` - Add new nav items (Experiments, Products, Contributions)
3. `src/App.tsx` - Add all new routes
4. `supabase/functions/generate-copy/index.ts` - Add bulk import type with 30k char support
5. `supabase/functions/analyze-site/index.ts` - Add logo extraction
6. `src/pages/admin/ProjectEditor.tsx` - Add BulkTextImporter, logo field
7. `src/pages/admin/ProductReviewEditor.tsx` - Add BulkTextImporter
8. `src/pages/admin/ClientProjectEditor.tsx` - Add BulkTextImporter
9. `src/pages/admin/ArticleEditor.tsx` - Add BulkTextImporter
10. `src/pages/admin/FavoriteEditor.tsx` - Add BulkTextImporter
11. `src/pages/admin/InspirationEditor.tsx` - Add BulkTextImporter
12. `src/pages/Projects.tsx` - Display project logos
13. `src/pages/ProjectDetail.tsx` - Display project logo in header

### Database Migrations (1)
1. Create `experiments` table
2. Create `products` table
3. Add `logo_url` column to `projects` table

---

## Implementation Order

### Phase 1: Critical Admin Fix
1. Update `Header.tsx` with admin role check and link (FIRST PRIORITY)

### Phase 2: Profile & Auth
2. Create `Profile.tsx` page
3. Add profile route to `App.tsx`

### Phase 3: Database Schema
4. Run migration for `experiments`, `products` tables
5. Add `logo_url` to projects table

### Phase 4: Experiments Feature
6. Create Experiments public pages
7. Create Experiments admin pages
8. Update navigation

### Phase 5: Store Preparation
9. Create Store public page
10. Create Products admin pages
11. Update navigation

### Phase 6: Bulk Text Importer
12. Create `BulkTextImporter` component
13. Update `generate-copy` edge function for bulk import
14. Integrate into all editor pages

### Phase 7: Logo Extraction
15. Update `analyze-site` edge function
16. Update `ProjectEditor.tsx` with logo field
17. Update project display components

### Phase 8: Admin Completeness
18. Create ContributionsManager
19. Verify all admin pages work correctly
20. Test multi-file uploads

### Phase 9: Final Verification
21. Test admin access after sign-in
22. Test all content CRUD operations
23. End-to-end testing

---

## Technical Notes

### Admin Check in Header (Security Critical)
```typescript
// Uses server-side has_role RPC - NOT localStorage
const { data: isAdmin } = useQuery({
  queryKey: ["is-admin-header", user?.id],
  queryFn: async () => {
    if (!user) return false;
    const { data } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    return data;
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000,
});
```

### Bulk Text Importer
- Uses existing `generate-copy` edge function
- Accepts up to 30,000 characters via textarea maxLength
- Returns structured JSON using AI tool calling
- Maps response to form fields automatically

### Shopify Integration Note
The Products table includes `shopify_product_id` and `shopify_variant_id` columns for future sync. When Shopify is connected:
1. Products can be synced bidirectionally
2. Orders will be handled by Shopify
3. Cart/checkout will use Shopify's embedded checkout or redirect

### Content Visibility Checklist
All these content types will have:
- Public page displaying content
- Admin list page showing all items
- Admin editor for create/edit
- Delete functionality with confirmation
