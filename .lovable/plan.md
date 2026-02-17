

# Fix Plan: Content Suggestions Accuracy and AI Gateway Errors

## Problem 1: Suggestions Silently Failing for Many Tables

**Root Cause:** `getSelectFields()` in `ContentSuggestions.tsx` builds a SELECT string using `BASE_FIELDS` which includes columns like `slug`, `updated_at`, `published`, `review_status`. Many tables don't have these columns. When PostgREST receives a select for a non-existent column, it returns a 400 error, and the `catch {}` block silently swallows it -- so those tables never get analyzed.

Tables that silently fail due to missing BASE_FIELDS columns:
- **artwork** -- no `name`, `slug`, `updated_at`, `published`, `review_status`
- **favorites** -- no `name`, `slug`, `updated_at`, `published`, `review_status`
- **skills** -- no `title`, `slug`, `updated_at`, `published`, `review_status`
- **learning_goals** -- no `name`, `slug`, `updated_at`, `published`, `review_status`
- **supplies_needed** -- no `title`, `slug`, `updated_at`, `published`, `review_status`
- **funding_campaigns** -- no `name`, `slug`, `published`, `review_status`

This means 6+ tables are completely invisible to the suggestions engine. Records that DO have content show up as "missing" because the query never returns data at all.

**Fix:** Replace the shared `BASE_FIELDS` approach with a per-table column map that only selects columns that actually exist. Create a `TABLE_COLUMNS` config in `adminRoutes.ts` defining the exact columns each table has (id + title/name field + optional slug, updated_at, published, review_status).

---

## Problem 2: AI Gateway Returns 500 Internal Server Error

**Root Cause:** The edge function logs show `AI gateway error: 500 {"type":"internal_server_error","message":"","details":""}` every time. This is the Lovable AI gateway rejecting the request. The most likely causes:

1. **Payload too large:** `fetchSiteContext()` does `select("*")` on 17 tables with `limit(10)`, sending ALL columns of up to 10 records per table. Tables like `projects` have 30+ columns including `case_study` (HTML), `jsonb` fields, etc. This creates a massive JSON blob that gets embedded in the system prompt. The combined system prompt + context easily exceeds token limits.

2. **Model issue:** The function uses `google/gemini-3-flash-preview` which is a preview model. If this model is unavailable or has issues, every request fails with a generic 500.

**Fixes:**

### Fix 2a: Reduce context payload size
- In `fetchSiteContext()`, change `select("*")` to select only the specific columns needed (id, title/name, slug, published, description truncated, dates) instead of all columns
- Reduce from `limit(10)` to `limit(5)` 
- Truncate description to 150 chars max
- Remove large fields (case_study, long_description, detailed_content, jsonb blobs) from the context

### Fix 2b: Add model fallback
- Try `google/gemini-2.5-flash` as primary (stable, not preview)
- If that fails with 500, the error message already surfaces to the user -- but at least the stable model is less likely to fail

### Fix 2c: Add request size logging
- Log the size of the outgoing request body in the edge function so gateway issues can be diagnosed

---

## Problem 3: Additional Suggestion Accuracy Issues

- **Stale content check uses string comparison:** `i.updated_at < ninetyDaysAgo` does a string comparison on ISO dates. This works for ISO format but tables without `updated_at` (artwork, favorites, skills, etc.) get skipped anyway due to Problem 1.
- **"supplies_needed" has no `updated_at` column** so stale check would fail even if the query worked.

---

## Files to Modify

### 1. `src/lib/adminRoutes.ts`
Add a `TABLE_COLUMNS` map defining which base columns exist per table:

```text
TABLE_COLUMNS = {
  articles: { id: "id", label: "title", slug: true, updated_at: true, published: true },
  artwork: { id: "id", label: "title", slug: false, updated_at: false, published: false },
  favorites: { id: "id", label: "title", slug: false, updated_at: false, published: false },
  skills: { id: "id", label: "name", slug: false, updated_at: false, published: false },
  supplies_needed: { id: "id", label: "name", slug: false, updated_at: false, published: false },
  ...etc for all 17 tables
}
```

### 2. `src/components/admin/ContentSuggestions.tsx`
- Replace `getSelectFields()` to use the new `TABLE_COLUMNS` map, only selecting columns that actually exist
- Use the correct label field (`title` vs `name` vs `project_name` vs `product_name`) per table
- Guard stale content check to only run when `updated_at` exists for that table

### 3. `src/hooks/useContentActions.ts` (fetchSiteContext)
- Replace `select("*")` with explicit column lists per table (id, title/name, slug, published, description, updated_at -- only columns that exist)
- Reduce `limit(10)` to `limit(5)`
- Truncate descriptions to 150 characters
- This dramatically reduces the payload sent to the AI gateway

### 4. `supabase/functions/ai-content-hub/index.ts`
- Change model from `google/gemini-3-flash-preview` to `google/gemini-2.5-flash` (stable, proven)
- Add `console.log` for outgoing request body size for debugging
- Add a size check: if context exceeds 50KB, truncate the context before sending

---

## Implementation Order

1. Update `adminRoutes.ts` with per-table column definitions
2. Fix `ContentSuggestions.tsx` to use correct columns per table
3. Slim down `fetchSiteContext()` payload in `useContentActions.ts`
4. Update edge function model and add size guards
5. Redeploy edge function

