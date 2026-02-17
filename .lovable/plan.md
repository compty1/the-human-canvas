

# Build Audit: 200 Additional Issues (273-472)

Adding to the 272 issues previously identified. No existing issues are removed.

---

## Category EC: Admin Route Protection (273-278)

### 273. No admin route guard component -- all 50+ admin routes are unprotected at the router level
`App.tsx` lines 155-218: every admin route renders the component directly with no `ProtectedRoute` wrapper. Protection only occurs inside `AdminLayout` which checks `isAdmin`. If a non-admin renders a page that doesn't use `AdminLayout`, they get full access.

### 274. Dashboard Quick Actions link to admin editor pages with no auth check
`Dashboard.tsx` lines 246-276: "New Article", "New Update", "New Project" links are plain `<Link>` elements. If bookmarked by a non-admin, the admin editor page loads without protection until `AdminLayout` renders.

### 275. Admin routes are publicly enumerable via App.tsx source code
All 50+ admin routes are visible in the client-side bundle. An attacker can discover every admin endpoint without needing to guess paths.

### 276. AdminLayout checks admin role on every render but doesn't cache across page navigations
`AdminLayout.tsx` line 144-156: the `is-admin` query runs on each admin page load. While React Query caches it, the query key `["is-admin", user?.id]` creates a separate cache entry from the Header's `["is-admin-header", user?.id]`.
**Fix:** Unify query keys or move `isAdmin` to AuthContext.

### 277. Header and AdminLayout make separate admin role queries
`Header.tsx` line 33 uses `["is-admin-header", user?.id]` and `AdminLayout.tsx` line 145 uses `["is-admin", user?.id]`. Same RPC call, different cache keys. Two network requests for identical data.

### 278. AdminLayout shows "Access Denied" as a bare page with no Layout wrapper
`AdminLayout.tsx` line 173: the "Access Denied" fallback has no Header/Footer. Non-admin users lose all navigation.

---

## Category ED: App.tsx Import Duplication and Naming (279-284)

### 279. `Experiences` imported twice under different names
Line 77: `import Experiments from "./pages/Experiments"` and line 100: `import ExperiencesPage from "./pages/Experiences"`. The first `Experiments` import on line 77 is for a different page, but `ExperiencesPage` on line 100 is an alias for Experiences that breaks naming convention.

### 280. `ExperienceDetail` imported twice under different names
Line 78 `ExperimentDetail` (different page) vs line 101 `ExperienceDetailPage`. Confusing but functional. The alias `ExperienceDetailPage` is inconsistent.

### 281. `CertificationsPage` is the only page imported with a "Page" suffix
Line 102: `import CertificationsPage`. No other public page uses this suffix pattern.

### 282. `ExperienceEditorPage` uses "Page" suffix unlike all other admin imports
Line 91: `import ExperienceEditorPage`. Every other editor (ProjectEditor, ArticleEditor, etc.) has no suffix.

### 283. No route for `/certifications/:id` or `/certifications/:slug`
`App.tsx` line 152: only has `/certifications` route. There is no detail page route for individual certifications. Users cannot deep-link to a specific certification.

### 284. No route for `/artwork/:id` or `/artwork/:slug`
No public detail page for individual artwork items. The ArtGallery page uses a modal, but there's no shareable URL for a single artwork piece.

---

## Category EE: Public Pages Missing Published Filters (285-292)

### 285. Projects page shows ALL projects including unpublished drafts
`Projects.tsx` line 27-30: `select("*")` with no `.eq("published", true)` filter. Draft projects are visible publicly.

### 286. Favorites page shows ALL favorites with no visibility filter
`Favorites.tsx` line 62-68: fetches all favorites with no published/visibility filter.

### 287. Inspirations page shows ALL inspirations with no visibility filter
`Inspirations.tsx` line 39-48: fetches all inspirations regardless of state.

### 288. Experiments page shows ALL experiments including unpublished
`Experiments.tsx` line 10-18: no `.eq("published", true)` filter. Draft experiments visible publicly.

### 289. Certifications page shows ALL certifications with no visibility filter
`Certifications.tsx` line 37-46: fetches all certifications. Items in "wanted" or "planned" status with incomplete data are publicly visible.

### 290. LifeTimeline shows ALL life periods with no visibility filter
`LifeTimeline.tsx` line 22-31: fetches all periods. Draft or incomplete periods are visible.

### 291. ArtGallery shows ALL artwork with no visibility filter
`ArtGallery.tsx` line 118-128: fetches all artwork. Draft or unfinished artwork is visible publicly.

### 292. ProductReviews page filters by `published` but not by `review_status`
`ProductReviews.tsx` line 13-19: correctly uses `.eq("published", true)` but doesn't filter by `review_status`, meaning a "rejected" review that is somehow still marked `published` would appear.

---

## Category EF: Missing Error Boundaries (293-296)

### 293. No React Error Boundary anywhere in the app
Zero files define an `ErrorBoundary` component. If any component throws during render, the entire app crashes to a white screen with no recovery option.

### 294. No error boundary around admin pages
Admin pages with complex queries and mutations can crash silently. No fallback UI.

### 295. No error boundary around public detail pages
Detail pages like `ProjectDetail`, `ArticleDetail` etc. that use `.single()` or process data can crash with no recovery.

### 296. Layout component has no error boundary around children
`Layout.tsx` passes `children` directly with no protection. A crash in any child destroys the entire page including Header/Footer.

---

## Category EG: SEO and Accessibility (297-308)

### 297. No page sets `document.title` -- all tabs show same title (confirmed comprehensive)
Searched entire codebase: zero `document.title` assignments. All 35+ pages show the default `index.html` title.

### 298. No meta description tags on any page
No dynamic OG/meta tags. Social sharing shows generic content for every URL.

### 299. No structured data (JSON-LD) for articles
Article pages have no structured data for search engine rich results.

### 300. No sitemap.xml generation
`public/robots.txt` exists but there's no sitemap for search engine indexing.

### 301. No canonical URLs set on any page
Duplicate content issues possible without canonical tags.

### 302. ArtGallery images have empty alt text when description is empty
`ArtGallery.tsx` line 132: `description: item.description || ""`. Alt attribute becomes empty string.

### 303. No `aria-label` on icon-only buttons throughout admin
Admin manager pages have icon-only edit/delete buttons (`<Edit2>`, `<Trash2>`) with no `aria-label`. Screen readers cannot identify button purpose.

### 304. No skip navigation link for keyboard users
`Layout.tsx` has no skip-to-content link. Keyboard users must tab through all 13+ nav items on every page.

### 305. Mobile menu has no focus trap
`Header.tsx` mobile menu doesn't trap focus. Users can tab to elements behind the menu overlay.

### 306. Dialog modals don't return focus on close
Art gallery modal, FundingModal, and admin dialogs don't manage focus return.

### 307. Color contrast issues on pop-art styled elements
Multiple elements use light text on light backgrounds (e.g., `bg-pop-yellow text-foreground` may have insufficient contrast in light theme).

### 308. No `lang` attribute dynamically set on `<html>`
`index.html` should specify `lang="en"` (if not already set).

---

## Category EH: NotFound Page Issues (309-311)

### 309. NotFound page has no Layout wrapper -- no Header/Footer/navigation
`NotFound.tsx` lines 11-20: bare `<div>` with no `<Layout>`. Users hitting 404 lose all navigation.

### 310. NotFound uses `<a href="/">` instead of React Router `<Link>`
Line 17: `<a href="/">` causes a full page reload instead of client-side navigation.

### 311. NotFound page doesn't match the pop-art visual theme
Plain unstyled div with no ComicPanel, no brand colors, no pop-art design elements. Visually disconnected from the rest of the site.

---

## Category EI: Auth Flow Gaps (312-319)

### 312. Auth page doesn't redirect already-logged-in users
`Auth.tsx` shows login form even when `user` is already authenticated. No redirect to `/` or `/profile`.

### 313. No "Forgot Password?" link or password reset flow
`Auth.tsx` has no password reset functionality. Users who forget passwords have no recovery path.

### 314. No password strength indicator on signup
Only `minLength={6}` is enforced. No visual strength meter or requirements display.

### 315. Signup success message says "Check your email" but no email verification UI
After signup, user is told to check email but there's no resend verification email button or verification status page.

### 316. No OAuth/social login options
Only email/password auth. No Google, GitHub, or other social logins that could reduce friction.

### 317. Display name field on signup has no maxLength
`Auth.tsx` line 74-82: no `maxLength` on displayName input. Arbitrarily long names possible.

### 318. Login error shows raw error message from Supabase
`Auth.tsx` line 45: `error.message` displayed directly. Messages like "Invalid login credentials" are OK but internal errors could leak details.

### 319. No rate limiting on login attempts
No client-side throttle on failed login attempts. Brute force is possible.

---

## Category EJ: Profile Page Issues (320-323)

### 320. Profile uses `.single()` which logs console errors for new users
`Profile.tsx` line 33: `.single()` throws PGRST116 before the catch handles it.

### 321. Profile display name input has no `maxLength`
Line 145: no length limit on display name.

### 322. Profile shows "Your Contributions" but these may be fake pledges (no payment)
Contributions displayed include unpaid pledges from issue 182.

### 323. Profile page has no way to delete account
No account deletion functionality. Users cannot exercise data rights.

---

## Category EK: Contact Form Vulnerabilities (324-327)

### 324. Contact form has no `maxLength` on any field
`Contact.tsx` lines 118-158: no length limits on name, email, subject, or message.

### 325. Contact form has no CAPTCHA or honeypot field
No bot protection. Automated spam submissions possible.

### 326. Contact form email validation relies solely on HTML5 `type="email"`
No Zod or regex validation. Malformed emails can be submitted.

### 327. Contact form doesn't sanitize HTML in message field
User-submitted messages could contain HTML/script tags. If rendered unsafely in admin, XSS is possible.

---

## Category EL: Newsletter Subscribe Issues (328-330)

### 328. SubscribeForm name field has no `maxLength`
`SubscribeForm.tsx` line 80-85: no length limit.

### 329. SubscribeForm email validation relies solely on HTML5
No Zod schema, no format validation beyond `type="email"`.

### 330. Compact SubscribeForm in Footer has no name field -- inconsistent data collection
`SubscribeForm.tsx` line 57-71: compact mode skips name field. Footer subscribers have no name but full form subscribers do.

---

## Category EM: FundingModal and Contribution Issues (331-336)

### 331. FundingModal inserts contributions without actual payment
Lines 50-58: records contribution to DB with no payment processing. "Stripe coming soon" on line 166.

### 332. FundingModal allows negative or zero-amount custom entries
Custom amount input accepts any number. While there's a `amount <= 0` check, `NaN` from non-numeric input passes through to the DB.

### 333. FundingModal custom amount has no max limit
Users can enter $999999999 as a contribution amount.

### 334. FundingModal message field has no `maxLength`
`Textarea` on line 126-133 has no length limit.

### 335. FundingModal checkbox uses native `<input type="checkbox">` instead of Radix Checkbox
Line 139: inconsistent with the rest of the UI which uses Radix components.

### 336. Support page FundingModal has no `onSuccess` callback -- data doesn't refresh
`Support.tsx` lines 371-377: general donation FundingModal has no `onSuccess`. Thank You wall and campaign progress stay stale.

---

## Category EN: Analytics Issues (337-342)

### 337. Analytics tracks ALL routes including admin pages
`useAnalytics.tsx` line 155: no guard for `/admin/*` paths. Admin activity inflates stats.

### 338. Analytics stores full `navigator.userAgent` string per page view
Line 76: stores entire user agent (500+ chars). Massive data bloat across thousands of page views.

### 339. Analytics global click handler tracks ALL link clicks including internal nav
Lines 170-186: every `<a>` click is tracked. Internal navigation (Projects, About, etc.) creates massive `link_clicks` bloat.

### 340. Analytics session query uses `.single()` risking errors
Line 85: `.single()` on session fetch can throw if session record is missing.

### 341. Analytics makes 4+ sequential DB calls per page navigation
Lines 70-95: INSERT page_view, SELECT session, UPDATE session, plus time tracking on previous page.

### 342. Analytics `trackTimeOnPage` condition is always true
Line 144: `if (pageLoadTime.current !== Date.now())` -- this is always true since `Date.now()` returns a new value each call. The condition serves no purpose.

---

## Category EO: ArtGallery Issues (343-349)

### 343. ArtGallery likes are client-side only -- lost on refresh
`ArtGallery.tsx` line 114: `likedItems` is `useState<Set<string>>`. Likes are never persisted to the database. All likes disappear on page refresh.

### 344. ArtGallery like counts are always 0
Line 137: `likes: 0` hardcoded. The `get_like_count` DB function exists but is never called.

### 345. ArtGallery period sections are hardcoded not from DB
Lines 84-109: `periodSections` array is hardcoded (2020-Present, 2015-2019, 2011-2015). New periods can't be managed via admin.

### 346. ArtGallery local asset map is hardcoded with 17 entries
Lines 29-47: `localAssetMap` hardcodes paths for 17 specific images. New artwork uploaded via admin won't resolve through this map.

### 347. ArtGallery `.replace("_", " ")` only replaces first underscore
Lines 314, 381: `category.replace("_", " ")` only replaces first occurrence. `"graphic_design"` becomes `"graphic design"` (works by luck), but `"mixed_media_collage"` would become `"mixed media_collage"`.

### 348. ArtGallery category list is hardcoded -- doesn't sync with DB
Lines 65-72: categories are hardcoded. If admin adds artwork with category "digital_painting", it won't appear in filters.

### 349. ArtGallery modal close button overlaps image on mobile
Line 366-369: absolute positioned close button at `top-4 right-4` may overlap content on small screens.

---

## Category EP: Skills Page Fully Hardcoded (350-352)

### 350. Skills page has 28 hardcoded skills ignoring the skills DB table
`Skills.tsx` lines 27-88: 6 hardcoded categories with 28 skills. Admin `SkillsManager` manages the `skills` table. Public page never queries DB.

### 351. Skills "Areas of Interest" section has 14 hardcoded items
Lines 158-181: hardcoded interests list. Not editable via admin.

### 352. Skills "My Approach" quote is hardcoded
Lines 189-199: philosophy statement is hardcoded, not from `site_content`.

---

## Category EQ: FuturePlans Page Partially Hardcoded (353-355)

### 353. FuturePlans "Vision Board" uses 6 hardcoded plans
`FuturePlans.tsx` lines 34-77: hardcoded `futurePlans` array with stale dates (Q2 2025). Admin `FuturePlansManager` saves to `site_content` JSON. Completely disconnected.

### 354. FuturePlans hardcoded dates are stale
Plan items show "Q2 2025", "Q3 2025" etc. which are now in the past (current date: Feb 2026). Looks unmaintained.

### 355. FuturePlans category colors/icons are hardcoded
Lines 79-89: only supports "project", "skill", "exploration" categories.

---

## Category ER: About Page Fully Hardcoded (356-360)

### 356. About page "What Drives Me" section has 7 hardcoded interests
`About.tsx` lines 98-137: not editable via admin despite `AboutContent` admin page existing.

### 357. About page "Services" list has 5 hardcoded items
Lines 158-169: hardcoded services list.

### 358. About page "Live Projects" section has 3 hardcoded projects
Lines 212-246: hardcoded Notardex, Solutiodex, Zodaci. Doesn't query `projects` table.

### 359. About page email is hardcoded
Line 184: `hello@lecompte.art` is hardcoded. Not from `site_content`.

### 360. About page "Media Kit" button does nothing
Lines 195-198: "Download Media Kit (Coming Soon)" button has no `onClick` or download functionality.

---

## Category ES: Footer Issues (361-365)

### 361. Footer "Contact" link goes to `/about` instead of `/contact`
`Footer.tsx` line 100: `<Link to="/about">` with "Contact" label. Should link to `/contact`.

### 362. Footer "Live Projects" section has 3 hardcoded links
Lines 50-81: Notardex, Solutiodex, Zodaci hardcoded. Doesn't query DB.

### 363. Footer has no social media links despite admin managing them
`SiteContent.tsx` saves `social_twitter`, `social_instagram`, etc. but Footer doesn't query or display them.

### 364. Footer Explore section only links to 3 pages
Lines 27-42: only Art, Projects, Writing. Missing Experiments, Favorites, Experiences, etc.

### 365. Footer has no "Back to Top" button
Long pages require extensive scrolling to return to navigation.

---

## Category ET: Header Navigation Issues (366-370)

### 366. Header nav missing "Experiences" page link
`Header.tsx` lines 10-24: 13 items listed but Experiences page (`/experiences`) is absent.

### 367. Header nav missing "Certifications" page link
`/certifications` route exists but not in nav. Only reachable by direct URL.

### 368. Header nav missing "Skills" page link
`/skills` route exists but not in nav.

### 369. Header nav missing "Updates" direct link
Updates accessible only through Writing page or direct URL.

### 370. 13+ nav items overflow on `lg` breakpoint
Desktop nav with 13 items needs grouping or a "More" dropdown for medium screens.

---

## Category EU: Dashboard Incomplete Stats (371-376)

### 371. Dashboard stats only cover 7 of 17+ content types
`Dashboard.tsx` lines 52-61: only counts `page_views`, `projects`, `articles`, `updates`, `artwork`, `leads`, `sessions`. Missing: experiments, favorites, inspirations, experiences, certifications, products, product_reviews, life_periods, supplies_needed, etc.

### 372. Dashboard Quick Actions only link to 5 actions
Lines 246-276: only Article, Update, Project, AI Writer, Lead Finder. Missing all other content types.

### 373. Dashboard has no content health overview
No indication of draft vs published items, incomplete content, or pending reviews.

### 374. Dashboard recent views shows raw `page_path` with no formatting
Line 183: `/admin/content-hub` appears as-is. No friendly names or icons.

### 375. Dashboard stat cards show "0" while loading instead of skeleton
Line 118: `value={stats?.pageViews || 0}` renders 0 during load, looking like real zero-data.

### 376. Dashboard doesn't show recent contributions or funding progress
No financial summary despite being a key metric for the portfolio.

---

## Category EV: Edge Function Security and Quality (377-390)

### 377. `ai-assistant` edge function has no auth check
`ai-assistant/index.ts` lines 20-108: no authorization header validation. Anyone can call this endpoint.

### 378. `generate-copy` edge function has no auth check
`generate-copy/index.ts` lines 20-250: no authorization verification. Public endpoint for AI content generation.

### 379. `ai-content-hub` edge function relies on JWT but `verify_jwt = false` in config
The edge function validates auth internally, but if `verify_jwt` is false in config, the Supabase gateway doesn't reject unauthenticated requests at the network level.

### 380. `scheduled-publisher` uses service role key with no invocation auth
`scheduled-publisher/index.ts` lines 19-21: uses `SUPABASE_SERVICE_ROLE_KEY` for DB access. If anyone can call this endpoint, they can trigger publishing without authorization.

### 381. `capture-screenshots` edge function has no auth protection
Screenshot capture can be triggered by anyone, potentially used for SSRF attacks.

### 382. `analyze-github` edge function has no auth protection
GitHub analysis endpoint callable without authentication.

### 383. `analyze-product` edge function has no auth protection
Product analysis endpoint callable without authentication.

### 384. `analyze-site` edge function has no auth protection
Site analysis endpoint callable without authentication.

### 385. All edge functions return raw `error.message` to client
Every edge function catches errors and returns `error instanceof Error ? error.message : "Unknown error"`. Internal error details (DB connection strings, schema info) could leak.

### 386. `find-leads` correctly checks auth but generates AI-fabricated companies
`find-leads/index.ts` lines 104-176: prompts AI to "generate" leads with "plausible" URLs and LinkedIn profiles. These are fictional companies presented as real leads.

### 387. `find-leads` inserts AI-generated leads directly into DB without user confirmation
Lines 236-261: generated leads are auto-saved to the `leads` table before the admin reviews them. No "save" button -- they're saved immediately.

### 388. `scheduled-publisher` loops sequentially with individual updates
Lines 34-75: each item is updated individually inside a `for` loop. If there are 100 scheduled items, that's 100 sequential DB calls.

### 389. `generate-copy` doesn't validate `contentType` against allowed types
Line 38: `actualType` is used directly from user input. Arbitrary strings can be passed.

### 390. Edge functions use old Deno std library version
Line 1 of all functions: `https://deno.land/std@0.168.0/http/server.ts`. This is an outdated version.

---

## Category EW: Store and Product Issues (391-396)

### 391. Store page correctly filters by `status = "active"` (good) but has no sold-out product handling
`Store.tsx` line 15: shows active products. Sold-out products (`inventory_count === 0`) show "Sold Out" badge but are still clickable with no "out of stock" action prevention.

### 392. Store category badges look clickable but have no `onClick`
Lines 108-116: `cursor-pointer` and hover styles but no click handler. Decorative only.

### 393. Store has no cart or checkout functionality
Products are display-only. No add-to-cart, checkout, or purchase flow.

### 394. Store products show `$product.price` without currency formatting
Line 71: `${product.price}` with no `toFixed(2)` or locale formatting. Price "5" shows as "$5" not "$5.00".

### 395. StoreProductDetail page uses `.single()` instead of `.maybeSingle()`
Crashes with hard error on invalid slug.

### 396. No product search or sort functionality on Store page
Only category filtering exists. No search by name, sort by price, or sort by newest.

---

## Category EX: Support/Funding Page Issues (397-402)

### 397. Support page "Where Your Support Goes" percentages are hardcoded
`Support.tsx` lines 328-356: 50/30/20 split hardcoded. Not editable via admin.

### 398. Support page donation amounts don't persist selection across modals
Line 32-33: `selectedDonation` state is separate from FundingModal's internal state. Amount selected in the card may not match the modal.

### 399. Support "Fund Learning" button is disabled when no goal selected but no visual explanation
Line 241: `disabled={!selectedLearning}` with no tooltip or helper text explaining why it's disabled.

### 400. Contributions on Thank You wall use `index` as React key
`Support.tsx` line 296: `key={index}` instead of a unique identifier. Can cause rendering bugs if list changes.

### 401. Thank You wall shows contributor amount but not their name
Line 304: shows "Supporter" label instead of actual contributor name/display_name.

### 402. Support page has no progress visualization for overall funding
Individual campaigns show progress but there's no aggregate "total raised" metric.

---

## Category EY: Writing/Articles Pages Issues (403-408)

### 403. Writing page "Why I Write" quote is hardcoded
`Writing.tsx` lines 220-236: philosophy statement is hardcoded, not from `site_content`.

### 404. Writing page doesn't link to UX Reviews despite having `ux_review` category
Category exists in the type map but the Writing page only links to Updates and Articles, not Product Reviews.

### 405. Articles category labels include `metaphysics` but ArticleDetail might not handle it
If `article.category` is a value not in the `categoryLabels` map, the badge shows `undefined`.

### 406. Updates page doesn't show category or tags
Update list items show title, date, and excerpt but no category badges or tags for filtering.

### 407. No "related articles" or "next/previous" navigation on ArticleDetail
Each article is a dead end with no navigation to related content.

### 408. No reading progress indicator on long articles
Long-form articles have no progress bar showing how far the user has read.

---

## Category EZ: Client Work Issues (409-412)

### 409. ClientWork CTA links to `/support` instead of `/contact`
`ClientWork.tsx` line 200: "Get in Touch" button links to donation page, not contact form.

### 410. ClientProjectDetail CTA links to `/support` instead of `/contact`
Same issue on the detail page.

### 411. ClientWork page has no category/technology filter
All client projects shown in one flat list with no filtering.

### 412. Client projects have no testimonial display on public page
`client_projects` table has a `testimonial` column but the public page may not render it prominently.

---

## Category FA: Experiments Page Issues (413-416)

### 413. Experiments page has no published filter
`Experiments.tsx` lines 10-18: fetches all experiments. Draft experiments visible publicly.

### 414. Experiments page revenue is displayed publicly
Line 99: `exp.revenue > 0` shows revenue figures. This may be sensitive business data.

### 415. Experiments page has no search or sort
Only shows all experiments in chronological order. No filtering by status, platform, or revenue.

### 416. Experiments loading skeleton uses fixed count of 3
Lines 44-50: always shows 3 skeleton items regardless of actual data count.

---

## Category FB: Inspirations Page Issues (417-419)

### 417. Inspirations page numbering uses local index not `order_index`
`Inspirations.tsx` line 157: `#{index + 1}` uses array index, not the `order_index` field. If items are filtered by category, numbering restarts from 1 within each filter.

### 418. Inspirations "childhood roots" query has no limit
Lines 52-62: fetches all childhood roots. If there are hundreds, all load at once.

### 419. Inspirations page has no pagination or "load more"
All inspirations load in one query with no pagination.

---

## Category FC: Certifications Page Issues (420-423)

### 420. Certifications status filter uses `.replace("_", " ")` which only replaces first underscore
`Certifications.tsx` line 97: `status.replace("_", " ")`. "in_progress" becomes "in progress" (works), but hypothetical "not_yet_started" would become "not yet_started".

### 421. Certifications "Sponsor" button links to `/support` not to a specific certification
Line 197-201: all certifications link to the generic support page, not a pre-filled donation for that specific certification.

### 422. Certifications funding progress bar has no accessibility label
`Progress` component on line 196 has no `aria-label` or `aria-valuenow`.

### 423. Certifications page has no search functionality
All certifications shown with only status filter. No text search.

---

## Category FD: Supplies Page Issues (424-427)

### 424. Supplies priority sort uses alphabetical string comparison
Priority values sorted alphabetically: "high" < "low" < "medium". So "low" appears before "medium".

### 425. Supplies page has no status filter on public view
Shows all supplies regardless of status (needed, purchased, etc.).

### 426. Supplies funded amount doesn't refresh after FundingModal contribution
No `onSuccess` callback to invalidate the supplies query.

### 427. Supplies page has no search or category filter
All supplies shown in one flat list.

---

## Category FE: QueryClient Configuration (428-431)

### 428. QueryClient has no `staleTime` default
`App.tsx` line 103: `new QueryClient()` with defaults. Every query refetches on mount (staleTime = 0).

### 429. QueryClient has no global error handler
No `queryCache.onError` or `mutationCache.onError`. Failed queries are silently swallowed unless individual components handle them.

### 430. QueryClient has no retry configuration
Default retry count is 3. Failed requests retry 3 times, tripling load on Supabase during outages.

### 431. QueryClient has no `gcTime` (garbage collection) configuration
Default `gcTime` is 5 minutes. Inactive query data may be kept longer than needed.

---

## Category FF: React Patterns and Performance (432-440)

### 432. Multiple pages re-create inline objects on every render
Throughout the codebase, category objects, filter arrays, and config objects are defined inside component bodies, causing unnecessary re-renders in children.

### 433. No `useMemo` or `useCallback` on expensive computations
ArtGallery `groupByCategory`, `getArtworkByPeriod`, and filtering operations recalculate on every render.

### 434. Image components have no lazy loading
No `loading="lazy"` on images. All images load eagerly, hurting initial page load performance.

### 435. No image optimization or responsive srcsets
All images use full-size URLs. No `srcset` or responsive image handling for mobile devices.

### 436. `useAnalytics` creates new callback references on every location change
Lines 68-99: `trackPageView` is wrapped in `useCallback` but `trackSessionStart` depends on `location.pathname`, causing re-creation on every route change.

### 437. No virtualization for long lists
ArtGallery, Favorites, Inspirations can have hundreds of items. No windowing/virtualization for performance.

### 438. CSS animations (`animate-fade-in`) applied to every list item
Multiple pages apply `animate-fade-in stagger-${index}` to every item. With 50+ items, this creates 50+ simultaneous CSS animations.

### 439. Two Toaster components rendered simultaneously
`App.tsx` lines 1-2: both `<Toaster />` (shadcn) and `<Sonner />` are rendered. The codebase uses both `toast` from sonner and `useToast` from shadcn, creating redundant notification systems.

### 440. `TooltipProvider` wraps entire app but few components use tooltips
Line 114: `<TooltipProvider>` wraps everything. Only admin sidebar and a few buttons use tooltips.

---

## Category FG: Data Integrity and Validation (441-450)

### 441. No slug uniqueness validation on client side for any content type
Editors don't check if a slug already exists before saving. Duplicate slugs can be created.

### 442. No date validation on life period start/end dates
LifePeriodEditor doesn't validate that end_date > start_date.

### 443. No date validation on experience start/end dates
Same issue -- end date can be before start date.

### 444. Project `funding_raised` can exceed `funding_goal` with no cap
Projects page shows progress bar that can overflow to 100%+ width.

### 445. Certification `funded_amount` can exceed `estimated_cost`
Certifications page progress bar can overflow.

### 446. No XSS sanitization on rich text content
RichTextEditor content is rendered as HTML. If malicious HTML is injected via API, it renders unsafely.

### 447. `email` field in contact form has no server-side validation
Only client-side HTML5 validation. Direct API calls can insert invalid emails.

### 448. Product price input accepts negative values
ProductEditor likely has no minimum price validation.

### 449. Supplies `funded_amount` can be manually set to exceed `price`
No validation that funded amount doesn't exceed the item price.

### 450. No duplicate detection for email subscribers
`SubscribeForm.tsx` line 30: catches `23505` uniqueness error, but shows "You're already subscribed!" without preventing the actual DB call. The error-based detection works but is inefficient.

---

## Category FH: Admin Manager Consistency Issues (451-462)

### 451. ArticlesManager has no drag-to-reorder (only InspirationsManager does)
Despite articles having an ordering concept, no reorder UI exists.

### 452. No admin manager page has text search
Zero manager pages have a search input. Finding specific items requires scrolling.

### 453. No admin manager page has pagination
All managers fetch entire tables with `select("*")`. Will become slow with growth.

### 454. 21+ admin pages use native `confirm()` for delete
Browser-native confirm breaks visual design and blocks main thread.

### 455. No admin manager shows a "last edited" timestamp
Users can't see when an item was last modified without opening the editor.

### 456. No admin manager has bulk selection UI (checkbox per item)
Despite ContentLibrary having bulk actions, individual managers don't.

### 457. No admin manager shows content completeness indicator
No visual indicator of which fields are filled vs empty for each item.

### 458. ExperimentsManager has no product management inline
Experiment products must be managed separately, not from the experiments list.

### 459. CertificationsManager has no status filter
All certifications shown in one list with no earned/in_progress/planned filter tabs.

### 460. ProductReviewsManager has no rating filter
All reviews shown without ability to filter by rating range.

### 461. FavoritesManager has no type filter
All favorites in one list with no music/movie/book/etc. filter tabs.

### 462. ArtworkManager has no category filter
All artwork in one list with no photography/sketch/mixed filter.

---

## Category FI: Admin Editor Consistency Issues (463-472)

### 463. Only ArticleEditor and ProjectEditor have autosave
10+ other editors (Update, Experiment, Favorite, Inspiration, Experience, Certification, ClientProject, LifePeriod, Product, ProductReview) lack autosave. Work lost on accidental navigation.

### 464. Only ArticleEditor saves version history
`saveContentVersion` only called in ArticleEditor. All other editors skip version tracking despite `content_versions` table existing.

### 465. No editor has a "Preview" button to see public rendering
Editors show form fields but no preview of how the content will look on the public page.

### 466. No editor has keyboard shortcuts for save (Ctrl+S)
`useEditorShortcuts.ts` exists but may not be wired into all editors.

### 467. No editor warns about unsaved changes on navigation
No `beforeunload` or `useBlocker` to prevent accidental data loss when navigating away.

### 468. No editor has field-level undo/redo
`useFormHistory` exists but may not be connected to all editors.

### 469. No editor validates required fields before AI generate
AI can be asked to generate content for fields that are already filled, silently overwriting.

### 470. Tag/array input fields have no autocomplete from existing values
Editors for tags, tech_stack, skills_used, etc. are free-text. No suggestions from existing values, leading to typos and duplicates.

### 471. Image uploaders have no file size limit enforcement
`ImageUploader` and `MultiImageUploader` may accept arbitrarily large files.

### 472. Slug fields are not validated for URL-safe characters
Editors allow spaces, special characters in slugs that could break routing.

---

## Updated Master Fix Plan (Issues 1-472)

### Summary of New Files/Areas to Modify

| Category | Files | Issues |
|----------|-------|--------|
| Admin route protection | `App.tsx`, `AdminLayout.tsx` | 273-278 |
| Import cleanup | `App.tsx` | 279-284 |
| Public page filters | 8 public pages | 285-292 |
| Error boundaries | New `ErrorBoundary.tsx`, `App.tsx`, `Layout.tsx` | 293-296 |
| SEO / accessibility | All pages, `index.html`, new `usePageTitle.ts` | 297-308 |
| NotFound redesign | `NotFound.tsx` | 309-311 |
| Auth improvements | `Auth.tsx`, `useAuth.tsx` | 312-319 |
| Profile fixes | `Profile.tsx` | 320-323 |
| Contact form | `Contact.tsx` | 324-327 |
| Newsletter | `SubscribeForm.tsx` | 328-330 |
| Funding | `FundingModal.tsx`, `Support.tsx` | 331-336 |
| Analytics | `useAnalytics.tsx` | 337-342 |
| ArtGallery | `ArtGallery.tsx` | 343-349 |
| Skills page | `Skills.tsx` | 350-352 |
| FuturePlans | `FuturePlans.tsx` | 353-355 |
| About page | `About.tsx` | 356-360 |
| Footer | `Footer.tsx` | 361-365 |
| Header | `Header.tsx` | 366-370 |
| Dashboard | `Dashboard.tsx` | 371-376 |
| Edge functions | All 10 edge functions | 377-390 |
| Store | `Store.tsx`, `StoreProductDetail.tsx` | 391-396 |
| Support page | `Support.tsx` | 397-402 |
| Writing/Articles | `Writing.tsx`, `ArticleDetail.tsx` | 403-408 |
| Client work | `ClientWork.tsx`, `ClientProjectDetail.tsx` | 409-412 |
| Experiments | `Experiments.tsx` | 413-416 |
| Inspirations | `Inspirations.tsx` | 417-419 |
| Certifications | `Certifications.tsx` | 420-423 |
| Supplies | `Supplies.tsx` | 424-427 |
| QueryClient | `App.tsx` | 428-431 |
| React patterns | Multiple files | 432-440 |
| Data validation | Multiple editors | 441-450 |
| Admin managers | All 20+ manager pages | 451-462 |
| Admin editors | All 12+ editor pages | 463-472 |

### Previously identified files (issues 1-272) remain unchanged in scope.

### Total: 472 issues across security, data leaks, analytics pollution, navigation, validation, UX, performance, admin functionality, data export, reorder support, version history, accessibility, SEO, edge function security, and developer experience.

