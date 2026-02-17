

# Comprehensive AI Content Hub Knowledge Enhancement

## Problem

The AI editor has incomplete knowledge of the build's database schema, table structures, and content types. This causes it to misroute content (e.g., creating `experiences` instead of `life_periods`). Multiple registries across the codebase are out of sync, and the system prompt lacks complete column definitions for most tables.

## Root Issues Found

1. **Edge function system prompt** has vague/incomplete schemas for most tables (e.g., `skills: (check existing schema)`, `supplies: (check existing schema)`)
2. **`ALLOWED_TABLES` in useContentActions.ts** is missing `supplies_needed` (the actual table name -- not `supplies`)
3. **`CONTENT_FIELDS` in adminRoutes.ts** is missing entries for `life_periods`, `learning_goals`, `funding_campaigns`, `supplies_needed`
4. **`fetchSiteContext` tables list** references `funding_campaigns` but not `supplies_needed`
5. **ContentHub overview stats** only checks 12 tables -- missing `life_periods`, `learning_goals`, `funding_campaigns`, `product_reviews`, `supplies_needed`
6. **The system prompt** doesn't include ALL column names for every table, leading the AI to guess wrong columns
7. **No `supplies` table exists** -- the actual table is called `supplies_needed`, but the code references `supplies` everywhere

## Plan

### 1. Complete System Prompt with Full Schemas (Edge Function)

**File:** `supabase/functions/ai-content-hub/index.ts`

Replace the partial "Required fields by table" section with exhaustive column definitions for every content table, derived from the actual database schema. This is the single most impactful change -- it prevents the AI from ever guessing wrong columns again.

Every table will list:
- All column names with types
- Which are required vs optional
- Valid enum values where applicable
- Array vs scalar fields

Key additions/fixes:
- `articles`: add all columns including `excerpt`, `content`, `tags`, `featured_image`, `reading_time_minutes`, `review_status`, `published`
- `projects`: add `description`, `long_description`, `tech_stack` (array), `features` (array), `image_url`, `status`, `published`, `review_status`
- `updates`: add `content`, `excerpt`, `tags`, `published`, `review_status`
- `experiences`: add all 20+ columns including `skills_used`, `tools_used`, `key_achievements`, `is_experimentation`, etc.
- `favorites`: add `type` (required), `streaming_links`, `release_year`, `is_childhood_root`, `media_subtype`, etc.
- `inspirations`: add `category` (required), `detailed_content`, `influence_areas` (array), `images` (array)
- `certifications`: add `status`, `earned_date`, `skills` (array), `estimated_cost`, `funded_amount`
- `client_projects`: add `tech_stack` (array), `features` (array), `testimonial`, `status`
- `skills`: `name` (required), `category` (required), `proficiency` (integer), `icon_name`
- `products`: `name`, `slug`, `price` (required), `description`, `images` (array), `tags` (array), `inventory_count`, `status`
- `product_reviews`: add `overall_rating`, `pain_points` (array), `strengths` (array), `technical_issues` (array), `screenshots` (array)
- `supplies_needed` (NOT `supplies`): `name` (required), `price` (required), `priority` (required), `category` (required), `status` (required), `description`, `product_url`, `funded_amount`
- Fix `supplies` references to `supplies_needed` throughout

Also add a "TABLE-TO-ADMIN-ROUTE MAPPING" section to the prompt so the AI knows the correct admin URL paths and can reference them.

Also add an "IMPORTANT DISAMBIGUATION" section:
- "life periods" = `life_periods` table (NOT `experiences`)
- "supplies" = `supplies_needed` table
- "client work" / "client projects" = `client_projects` table
- "store products" = `products` table (NOT `experiment_products`)

### 2. Fix Table Name: `supplies` to `supplies_needed`

**Files:** `src/hooks/useContentActions.ts`, `src/lib/adminRoutes.ts`, `supabase/functions/ai-content-hub/index.ts`

The actual database table is `supplies_needed`, not `supplies`. Update:
- `ALLOWED_TABLES` array: add `"supplies_needed"`
- `ADMIN_ROUTES`: change key from `supplies` to `supplies_needed`
- `CONTENT_FIELDS`: add `supplies_needed` entry
- `fetchSiteContext` tables array: replace/add `supplies_needed`
- Edge function prompt: use `supplies_needed`

### 3. Complete All Registries in adminRoutes.ts

**File:** `src/lib/adminRoutes.ts`

- Add missing entries to `CONTENT_FIELDS`:
  - `life_periods: ["description", "detailed_content", "image_url", "themes"]`
  - `learning_goals: ["description"]`
  - `funding_campaigns: ["description"]`
  - `supplies_needed: ["description", "image_url"]`

- Fix `ADMIN_ROUTES` key from `supplies` to `supplies_needed`

### 4. Expand fetchSiteContext with ALL Columns

**File:** `src/hooks/useContentActions.ts`

- Add `supplies_needed` to tables array
- Expand the `recent` record summary to include more fields so the AI has richer context:
  - Add `start_date`, `end_date`, `is_current` for life_periods/experiences
  - Add `themes`, `type` for favorites/life_periods
  - Add `price`, `priority` for supplies_needed
  - Add `platform` for experiments

### 5. Complete ContentHub Overview Stats

**File:** `src/pages/admin/ContentHub.tsx`

Add all missing tables to the `contentStats` query:
- `life_periods`, `learning_goals`, `funding_campaigns`, `supplies_needed`, `product_reviews`

### 6. Complete ContentSuggestions Coverage

**File:** `src/components/admin/ContentSuggestions.tsx`

Currently only scans tables listed in `CONTENT_FIELDS`. After fixing `CONTENT_FIELDS` in step 3, this will automatically cover the new tables too.

### 7. Send Change History to AI

**File:** `src/hooks/useContentActions.ts`

Add recent AI change history (last 10 changes) to `fetchSiteContext` output so the AI knows what it recently did and can avoid repeating mistakes or creating duplicates.

---

## Summary of Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/ai-content-hub/index.ts` | Complete schema for all 17+ tables, disambiguation rules, admin route mapping |
| `src/hooks/useContentActions.ts` | Fix `supplies_needed`, add to ALLOWED_TABLES, enrich context with more fields + change history |
| `src/lib/adminRoutes.ts` | Fix `supplies` -> `supplies_needed`, add missing CONTENT_FIELDS entries |
| `src/pages/admin/ContentHub.tsx` | Add all missing tables to overview stats |

No database changes required.

