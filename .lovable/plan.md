

# Fix: AI Content Hub Not Recognizing life_periods (and other missing tables)

## Root Cause

Two specific bugs prevent the AI from creating life period records:

1. **The edge function system prompt omits `life_periods`** from its list of known tables and required fields. When you say "add a life period," the AI doesn't know about the `life_periods` table and incorrectly creates an `experiences` record instead.

2. **`fetchSiteContext()` doesn't include `life_periods`** (or `life_periods`, `learning_goals`, `funding_campaigns`, or `supplies`) in the tables it sends to the AI. So the AI has zero awareness of those content types.

The change history confirms this: the AI inserted into the `experiences` table with experience-specific columns instead of using `life_periods` with its proper columns (`start_date`, `end_date`, `themes`, `is_current`, etc.).

---

## Fix 1: Update Edge Function System Prompt

**File:** `supabase/functions/ai-content-hub/index.ts`

Add `life_periods` (and the other missing tables) to the system prompt's required fields section:

```
- life_periods: title (required), start_date (required, date format YYYY-MM-DD), end_date (optional), description, detailed_content, themes (text array), image_url, is_current (boolean), order_index (integer)
- learning_goals: (check existing schema)
- funding_campaigns: (check existing schema)
- supplies: (check existing schema)
```

Also update the opening sentence to explicitly list `life_periods` as a managed content type so the AI considers it when interpreting requests about "periods" or "timeline."

## Fix 2: Expand fetchSiteContext to Include All Tables

**File:** `src/hooks/useContentActions.ts`

Add the missing tables to the `tables` array (line 262):

```typescript
const tables = [
  "articles", "updates", "projects", "artwork", "experiments",
  "favorites", "inspirations", "experiences", "certifications",
  "client_projects", "skills", "products", "product_reviews",
  "life_periods", "learning_goals", "funding_campaigns", "supplies",
];
```

This ensures the AI receives current life_periods data (counts, recent records, stale indicators) in every request.

## Fix 3: Clean Up the Incorrectly Created Records

The failed attempt created 2 records in the `experiences` table that should not exist:
- `d26d6e8b-20c1-4023-8bee-85777e62a4c7` -- "The Gaspless Void: A Mind Apart (2020-2025)"
- `bcccb15d-b19e-4b98-8be0-9999b07c0579` -- "The Great Isolation: A Journey Through Deep Solitude"

These should be deleted (or you can revert them from the change history in the Content Hub).

---

## Summary

| File | Change |
|------|--------|
| `supabase/functions/ai-content-hub/index.ts` | Add life_periods, learning_goals, funding_campaigns, supplies to system prompt with correct column schemas |
| `src/hooks/useContentActions.ts` | Add missing tables to fetchSiteContext's table list |

After these fixes, asking the AI to "add a life period" will correctly target the `life_periods` table with the right columns (`title`, `start_date`, `themes`, etc.).
