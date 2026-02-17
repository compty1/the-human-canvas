
# Comprehensive Bug Fix & Wiring Completion Plan

This plan identifies and fixes **55 distinct issues** across the codebase, organized by severity.

---

## CRITICAL: 406 Errors from `.single()` Queries (5 issues)

These cause network errors on every page load visible in the console right now.

| # | File | Line | Issue |
|---|---|------|-------|
| 1 | `src/components/layout/Header.tsx` | 46 | `.single()` on `nav_items` query returns 406 when no row exists |
| 2 | `src/pages/Index.tsx` | 52 | `.single()` on `homepage_sections` returns 406 |
| 3 | `src/pages/Index.tsx` | 65 | `.single()` on `ticker_items` returns 406 |
| 4 | `src/pages/Index.tsx` | 75 | `.single()` on `featured_project_ids` returns 406 |
| 5 | `src/hooks/useThemeColors.ts` | 73 | `.single()` on `theme_colors` returns 406 |

**Fix:** Change all five to `.maybeSingle()`.

---

## CRITICAL: Authentication Bug in AI Content Hub (1 issue)

| # | File | Line | Issue |
|---|---|------|-------|
| 6 | `src/components/admin/ContentHubChat.tsx` | 161 | Uses `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) as Bearer token instead of the user's JWT session token. Causes "gateway error" intermittently and means the edge function has no real user context. |

**Fix:** Get session token via `supabase.auth.getSession()` and use `session?.access_token`.

---

## CRITICAL: XSS Vulnerabilities -- No DOMPurify (9 issues)

DOMPurify is not installed (`package.json` has no `dompurify` dependency), yet `dangerouslySetInnerHTML` is used in 9 locations with user/AI-generated HTML content:

| # | File | Issue |
|---|---|-------|
| 7 | `src/pages/About.tsx:103` | `bioFull` from DB rendered unsanitized |
| 8 | `src/pages/LifePeriodDetail.tsx:213` | `period.detailed_content` unsanitized |
| 9 | `src/pages/ProjectDetail.tsx:410` | `project.case_study` unsanitized |
| 10 | `src/pages/ProductReviewDetail.tsx:358` | `review.content` unsanitized |
| 11 | `src/pages/ExperimentDetail.tsx:185` | `experiment.case_study` unsanitized |
| 12 | `src/pages/InspirationDetail.tsx:148` | `inspiration.detailed_content` unsanitized |
| 13 | `src/components/admin/ContentHubChat.tsx:374` | AI markdown rendered unsanitized |
| 14 | `src/components/editor/RichTextContent.tsx:25` | Generic rich text content unsanitized |
| 15 | `src/components/ui/chart.tsx:70` | Style injection (lower risk but still) |

**Fix:** Install `dompurify` + `@types/dompurify`, create a `sanitizeHtml` utility, and wrap all `dangerouslySetInnerHTML` usages.

---

## HIGH: React Ref Warning on LikeButton (1 issue)

| # | File | Issue |
|---|---|-------|
| 16 | `src/components/pop-art/LikeButton.tsx` | Console warning: "Function components cannot be given refs." LikeButton is not wrapped in `forwardRef` but is being passed a ref by parent components (ArtGallery via ComicPanel). |

**Fix:** Wrap `LikeButton` in `forwardRef`.

---

## HIGH: Analytics Session Tracking 406 Error (1 issue)

| # | File | Line | Issue |
|---|---|------|-------|
| 17 | `src/hooks/useAnalytics.tsx` | 85 | `.single()` on `sessions` table fails with 406 when session doesn't exist yet (visible in network logs). |

**Fix:** Change to `.maybeSingle()`.

---

## HIGH: Content Suggestions False Positives (3 issues)

| # | File | Issue |
|---|---|-------|
| 18 | `src/lib/adminRoutes.ts` | `CONTENT_FIELDS` includes optional fields like `image_url`, `tags`, `themes`, `features` that create noisy "missing content" suggestions for records that are otherwise complete |
| 19 | `src/components/admin/ContentSuggestions.tsx` | All missing fields flagged at same severity -- optional fields like `image_url` should be "low" not "high/medium" |
| 20 | `src/components/admin/ContentSuggestions.tsx` | Artwork records with numeric titles (e.g., "164") and null descriptions are flagged as missing content, but artwork descriptions are genuinely optional in this portfolio context |

**Fix:** Split `CONTENT_FIELDS` into required vs optional. Demote optional fields to "low" severity.

---

## HIGH: Homepage Not Wired to Admin Editable Fields (3 issues)

| # | File | Issue |
|---|---|-------|
| 21 | `src/pages/Index.tsx` | `hero_title`, `hero_subtitle`, `hero_description` fields saved in HomeContent admin are never read by Index.tsx -- hero text is hardcoded |
| 22 | `src/pages/Index.tsx` | `mission_statement` saved in HomeContent admin is never read -- mission text is hardcoded |
| 23 | `src/pages/Index.tsx` | Admin hero title/subtitle/description edits have zero effect on the live homepage |

**Fix:** Fetch `hero_title`, `hero_subtitle`, `hero_description`, `mission_statement` from `site_content` and use them in the hero/mission sections, falling back to current hardcoded values.

---

## HIGH: About Page Still Has Hardcoded Sections (3 issues)

| # | File | Issue |
|---|---|-------|
| 24 | `src/pages/About.tsx:235-250` | "My Live Projects" section is hardcoded with Notardex/Solutiodex/Zodaci -- should read from `projects` table |
| 25 | `src/pages/About.tsx:203-208` | Email "hello@lecompte.art" is hardcoded -- should read `contact_email` from `site_content` |
| 26 | `src/pages/About.tsx` | `about_location` and `experience_years` are fetched from DB but never rendered anywhere on the page |

**Fix:** Wire up projects from DB, use `contact_email` from `site_content`, and display location/experience_years.

---

## HIGH: Footer Still Has Hardcoded Project Links (1 issue)

| # | File | Issue |
|---|---|-------|
| 27 | `src/components/layout/Footer.tsx:93-108` | "Live Projects" section hardcodes Notardex/Solutiodex/Zodaci links -- should come from projects table or `site_content` |

**Fix:** Fetch live projects from DB or make configurable via `site_content`.

---

## MEDIUM: useSiteSettings Hook Created But Never Used (1 issue)

| # | File | Issue |
|---|---|-------|
| 28 | `src/hooks/useSiteSettings.ts` | Hook exists and fetches layout settings, but no component imports or uses it. The mobile column, hero visibility, and sticky filter settings saved in admin have zero effect on the public site. |

**Fix:** Import `useSiteSettings` in relevant components (ArtGallery filter bar, homepage hero, card grid layouts) and apply the settings.

---

## MEDIUM: Editor Pages Using `.single()` That Could Fail (5 issues)

These are in admin editor pages where the record should exist, but navigating to a deleted/invalid ID would crash:

| # | File | Issue |
|---|---|------|
| 29 | `src/pages/admin/LifePeriodEditor.tsx:48` | `.single()` -- should use `.maybeSingle()` |
| 30 | `src/pages/admin/ArtworkEditor.tsx:38` | `.single()` -- should use `.maybeSingle()` |
| 31 | `src/pages/admin/ExperienceEditor.tsx:116` | `.single()` -- should use `.maybeSingle()` |
| 32 | `src/pages/admin/ExperimentEditor.tsx:64` | `.single()` -- should use `.maybeSingle()` |
| 33 | `src/pages/admin/CertificationEditor.tsx:99` | `.single()` -- should use `.maybeSingle()` |

And 5 more editors: `ProductEditor:47`, `ProjectEditor:168`, `FavoriteEditor:124`, `InspirationEditor:121`, `ClientProjectEditor:50`, `LeadDetail:61`.

| 34 | `src/pages/admin/ProductEditor.tsx:47` | `.single()` |
| 35 | `src/pages/admin/ProjectEditor.tsx:168` | `.single()` |
| 36 | `src/pages/admin/FavoriteEditor.tsx:124` | `.single()` |
| 37 | `src/pages/admin/InspirationEditor.tsx:121` | `.single()` |
| 38 | `src/pages/admin/ClientProjectEditor.tsx:50` | `.single()` |

**Fix:** Change all to `.maybeSingle()` and add "not found" UI handling.

---

## MEDIUM: ExperimentDetail Uses `.single()` (1 issue)

| # | File | Issue |
|---|---|-------|
| 39 | `src/pages/ExperimentDetail.tsx:19` | Public page uses `.single()` by slug -- will 406 if slug doesn't match |

**Fix:** Change to `.maybeSingle()`.

---

## MEDIUM: Missing `staleTime` on Index.tsx Queries (2 issues)

| # | File | Issue |
|---|---|-------|
| 40 | `src/pages/Index.tsx:62-68` | `tickerContent` query has no `staleTime` -- refetches on every mount |
| 41 | `src/pages/Index.tsx:72-78` | `featuredProjectIds` query has no `staleTime` -- refetches on every mount |

**Fix:** Add `staleTime: 5 * 60 * 1000` to match other site_content queries.

---

## MEDIUM: Likes Are Client-Side Only (1 issue)

| # | File | Issue |
|---|---|-------|
| 42 | `src/pages/ArtGallery.tsx:170-180` | Like state is stored in `useState` only -- likes are lost on page refresh. A `get_like_count` DB function exists but is never called. The `likes` table exists but artwork doesn't use it. |

**Fix:** Wire up the `likes` table and `get_like_count` function to persist likes.

---

## MEDIUM: ContentHubChat Missing Error Recovery (2 issues)

| # | File | Issue |
|---|---|-------|
| 43 | `src/components/admin/ContentHubChat.tsx:249` | On JSON parse failure, the buffer is re-prepended which can cause infinite re-parse loops on malformed SSE data |
| 44 | `src/components/admin/ContentHubChat.tsx:169-171` | Error response parsing can fail silently if response is not JSON -- should handle text error bodies |

**Fix:** Add proper error recovery with retry limit and text fallback for error bodies.

---

## MEDIUM: Edge Function Has No Auth Verification (1 issue)

| # | File | Issue |
|---|---|-------|
| 45 | `supabase/functions/ai-content-hub/index.ts` | No JWT verification at all -- anyone with the anon key can call this function and consume AI credits. Should verify the user is an admin. |

**Fix:** Add `getClaims()` verification and admin role check.

---

## LOW: Theme Colors Not Applied Instantly (1 issue)

| # | File | Issue |
|---|---|-------|
| 46 | `src/hooks/useThemeColors.ts:89-91` | Sets CSS properties on `document.documentElement` but uses `--pop-gold` etc. format, while the CSS variables in `index.css` are defined as `--pop-gold: 38 78% 56%`. Need to verify the variable names match exactly. |

**Fix:** Verify CSS variable name mapping is consistent.

---

## LOW: HomeContent Editor Fields Not Connected to Homepage (2 issues)

| # | File | Issue |
|---|---|-------|
| 47 | `src/pages/admin/HomeContent.tsx` | Saves `hero_title`, `hero_subtitle`, `hero_description`, `mission_statement` to `site_content` but `Index.tsx` never reads them |
| 48 | `src/pages/admin/HomeContent.tsx` | No preview of how sections will look -- admin saves blindly |

**Fix:** (Issue 47 overlaps with #21-23 above -- will be fixed together.)

---

## LOW: Data Export Missing Tables (1 issue)

| # | File | Issue |
|---|---|-------|
| 49 | `src/pages/admin/Settings.tsx:184` | Export only covers 7 tables (`projects, articles, updates, artwork, skills, learning_goals, admin_notes`) but the site has 17+ content tables. Missing: experiments, favorites, inspirations, experiences, certifications, client_projects, products, product_reviews, life_periods, funding_campaigns, supplies_needed, site_content. |

**Fix:** Add all content tables to the export list.

---

## LOW: ArticleDetail Missing `metaphysics` Category (1 issue)

| # | File | Issue |
|---|---|-------|
| 50 | `src/pages/ArticleDetail.tsx:12-19` | `categoryLabels` and `categoryColors` maps don't include "metaphysics" but the ArticleEditor allows it as a category option. Articles with category "metaphysics" will show raw key instead of label. |

**Fix:** Add `metaphysics` to both maps.

---

## LOW: Conversation Save Uses `.single()` (1 issue)

| # | File | Issue |
|---|---|-------|
| 51 | `src/components/admin/ContentHubChat.tsx:130` | `saveConversation` insert uses `.single()` -- could fail on RLS or constraint issues |

**Fix:** Change to `.maybeSingle()` with error handling.

---

## LOW: Admin `useContentActions` Snapshots Use `.single()` (3 issues)

| # | File | Issue |
|---|---|-------|
| 52 | `src/hooks/useContentActions.ts:105` | Update snapshot fetch uses `.single()` |
| 53 | `src/hooks/useContentActions.ts:127` | Delete snapshot fetch uses `.single()` |
| 54 | `src/hooks/useContentActions.ts:228` | Revert single change fetch uses `.single()` |

**Fix:** Change to `.maybeSingle()`.

---

## LOW: Default Theme Setting Not Applied (1 issue)

| # | File | Issue |
|---|---|-------|
| 55 | `src/main.tsx:7` | `ThemeProvider defaultTheme="system"` is hardcoded. The admin can set `default_theme` in Settings, but it's stored in `site_content` and never read by `ThemeProvider`. |

**Fix:** This requires reading the setting before React renders, which is complex. Simplest fix: read `default_theme` via the `useSiteSettings` hook and call `setTheme()` from `next-themes` once on mount if no user preference is stored.

---

## Summary of Files to Modify

| File | Issues Fixed |
|---|---|
| `src/components/layout/Header.tsx` | #1 |
| `src/pages/Index.tsx` | #2, #3, #4, #21, #22, #23, #40, #41 |
| `src/hooks/useThemeColors.ts` | #5, #46 |
| `src/components/admin/ContentHubChat.tsx` | #6, #13, #43, #44, #51 |
| `src/pages/About.tsx` | #7, #24, #25, #26 |
| `src/pages/LifePeriodDetail.tsx` | #8 |
| `src/pages/ProjectDetail.tsx` | #9 |
| `src/pages/ProductReviewDetail.tsx` | #10 |
| `src/pages/ExperimentDetail.tsx` | #11, #39 |
| `src/pages/InspirationDetail.tsx` | #12 |
| `src/components/editor/RichTextContent.tsx` | #14 |
| `src/components/pop-art/LikeButton.tsx` | #16 |
| `src/hooks/useAnalytics.tsx` | #17 |
| `src/lib/adminRoutes.ts` | #18 |
| `src/components/admin/ContentSuggestions.tsx` | #19, #20 |
| `src/components/layout/Footer.tsx` | #27 |
| Multiple admin editors (10 files) | #29-#38 |
| `src/pages/ArtGallery.tsx` | #42 |
| `supabase/functions/ai-content-hub/index.ts` | #45 |
| `src/pages/admin/Settings.tsx` | #49 |
| `src/pages/ArticleDetail.tsx` | #50 |
| `src/hooks/useContentActions.ts` | #52, #53, #54 |
| `src/main.tsx` or `src/App.tsx` | #55 |
| New: `src/lib/sanitize.ts` | DOMPurify utility for #7-#15 |
| `package.json` | Add `dompurify` + `@types/dompurify` |

## Implementation Order

1. Install DOMPurify and create sanitize utility (fixes 9 XSS issues)
2. Fix all `.single()` to `.maybeSingle()` (fixes 17 query issues)
3. Fix ContentHubChat auth token (fixes gateway errors)
4. Wire homepage to admin-editable fields (fixes 3 disconnected fields)
5. Wire About page remaining hardcoded sections
6. Wire Footer live projects from DB
7. Fix ContentSuggestions false positives
8. Add forwardRef to LikeButton
9. Connect useSiteSettings to public components
10. Fix remaining low-priority items
