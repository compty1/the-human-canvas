

# Complete Remaining Gaps Audit: 150+ Fixes

After a thorough audit of every file in the codebase, here are all remaining functionality gaps organized by category.

---

## Category A: Remaining Native Dialog Replacements (3 files)

These were missed in previous rounds:

1. **ExperimentProductEditor.tsx line 241** -- `confirm("Delete this product?")` for product deletion
2. **useEditorShortcuts.ts line 57** -- `confirm("You have unsaved changes...")` on Escape key
3. **EditorToolbar.tsx line 56** -- `window.prompt("URL", previousUrl)` for link URL input

**Fix**: Replace with DeleteConfirmDialog, onUnsavedExit callback, and a small Dialog with URL Input respectively. The EditorToolbar fix affects every rich text editor in the app (Articles, Updates, Projects, Inspirations, Experiences, etc.).

---

## Category B: Query Invalidation Gaps (2 editors)

4. **ExperienceEditor.tsx line 186** -- Only invalidates `["admin-experiences"]`, missing `["experiences"]` for the public page
5. **ProductReviewEditor.tsx line 124** -- Only invalidates `["product-reviews"]`, missing `["admin-product-reviews"]` for the admin manager list

---

## Category C: ContentLibrary Duplicate URL Bug (1 file)

6. **ContentLibrary.tsx line 394** -- The "Duplicate" link hardcodes routes for only article/update/project. For `experiment` and `product_review` types, it falls through to `"projects"` incorrectly. Fix: map all 5 content types to their correct `/new?clone=` URLs.

---

## Category D: Clone/Duplicate Support Missing from All Editors (13 editors)

No editor currently reads the `?clone=` URL parameter, meaning the DuplicateButton navigates to `/new?clone=ID` but the editor ignores it -- the form opens blank.

7. **ArticleEditor.tsx** -- No clone logic
8. **UpdateEditor.tsx** -- No clone logic
9. **ProjectEditor.tsx** -- No clone logic
10. **ExperimentEditor.tsx** -- No clone logic
11. **ProductReviewEditor.tsx** -- No clone logic
12. **ExperienceEditor.tsx** -- No clone logic
13. **CertificationEditor.tsx** -- No clone logic
14. **ClientProjectEditor.tsx** -- No clone logic
15. **FavoriteEditor.tsx** -- No clone logic
16. **InspirationEditor.tsx** -- No clone logic
17. **LifePeriodEditor.tsx** -- No clone logic
18. **ArtworkEditor.tsx** -- No clone logic
19. **ProductEditor.tsx** -- No clone logic

**Fix**: In each editor, read `searchParams.get("clone")`, fetch that record, and populate the form (with a new slug and title suffix " (Copy)").

---

## Category E: DuplicateButton Missing from Managers (10 files)

Only ArticlesManager, UpdatesManager, and ProjectsManager include DuplicateButton. Missing from:

20. **ExperimentsManager.tsx**
21. **ExperiencesManager.tsx**
22. **ProductReviewsManager.tsx**
23. **CertificationsManager.tsx**
24. **ClientWorkManager.tsx**
25. **FavoritesManager.tsx**
26. **InspirationsManager.tsx**
27. **LifePeriodsManager.tsx**
28. **ArtworkManager.tsx**
29. **ProductsManager.tsx**

---

## Category F: BulkActionsBar Missing from Managers (8 files)

Only ArticlesManager, UpdatesManager, ProjectsManager, FavoritesManager, ProductsManager, and ProductReviewsManager have BulkActionsBar. Missing from:

30. **ExperimentsManager.tsx**
31. **ExperiencesManager.tsx**
32. **CertificationsManager.tsx**
33. **ClientWorkManager.tsx**
34. **InspirationsManager.tsx**
35. **LifePeriodsManager.tsx**
36. **ArtworkManager.tsx**
37. **SuppliesManager.tsx**

---

## Category G: Autosave Missing from Editors (11 editors)

Only ArticleEditor and ProjectEditor use `useAutosave`. Missing from:

38. **UpdateEditor.tsx**
39. **ExperimentEditor.tsx**
40. **ProductReviewEditor.tsx**
41. **ExperienceEditor.tsx**
42. **CertificationEditor.tsx**
43. **ClientProjectEditor.tsx**
44. **FavoriteEditor.tsx**
45. **InspirationEditor.tsx**
46. **LifePeriodEditor.tsx**
47. **ArtworkEditor.tsx**
48. **ProductEditor.tsx**

---

## Category H: Keyboard Shortcuts Missing from Editors (10 editors)

Only ArticleEditor, ProjectEditor, and LifePeriodEditor use `useEditorShortcuts`. Missing from:

49. **UpdateEditor.tsx** -- has manual Ctrl+Z but no Ctrl+S save shortcut
50. **ExperimentEditor.tsx**
51. **ProductReviewEditor.tsx**
52. **ExperienceEditor.tsx**
53. **CertificationEditor.tsx**
54. **ClientProjectEditor.tsx**
55. **FavoriteEditor.tsx**
56. **InspirationEditor.tsx**
57. **ArtworkEditor.tsx**
58. **ProductEditor.tsx**

---

## Category I: VersionHistory/SaveContentVersion Missing from Editors (12 editors)

Only ArticleEditor uses VersionHistory and saveContentVersion. Missing from:

59. **UpdateEditor.tsx**
60. **ProjectEditor.tsx**
61. **ExperimentEditor.tsx**
62. **ProductReviewEditor.tsx**
63. **ExperienceEditor.tsx**
64. **CertificationEditor.tsx**
65. **ClientProjectEditor.tsx**
66. **FavoriteEditor.tsx**
67. **InspirationEditor.tsx**
68. **LifePeriodEditor.tsx**
69. **ArtworkEditor.tsx**
70. **ProductEditor.tsx**

---

## Category J: DraftRecoveryBanner Missing from Editors (11 editors)

Only ArticleEditor and ProjectEditor show DraftRecoveryBanner. Missing from all editors that would get autosave (items 38-48 above):

71-81. Same 11 editors as Category G.

---

## Category K: KeyboardShortcutsHelp Missing from Editors (11 editors)

Only ArticleEditor and ProjectEditor show the KeyboardShortcutsHelp button. Missing from:

82-92. Same 11 editors as Category H minus LifePeriodEditor (10 editors).

---

## Category L: AIGenerateButton Missing from Editors (6 editors)

ArticleEditor, UpdateEditor, ProjectEditor, ExperienceEditor, InspirationEditor, CertificationEditor, and FavoriteEditor have AIGenerateButton. Missing from:

93. **ExperimentEditor.tsx** -- description, long_description, case_study fields
94. **ProductReviewEditor.tsx** -- summary, content fields
95. **ClientProjectEditor.tsx** -- description, long_description fields
96. **ArtworkEditor.tsx** -- description field
97. **LifePeriodEditor.tsx** -- description, detailed_content fields
98. **ProductEditor.tsx** -- description field

---

## Category M: ArtGallery Public Page Gaps (5 issues)

99. **Missing categories** -- `portrait`, `landscape`, `pop_art` exist in ArtworkEditor but not in ArtGallery categories array
100. **images[] not fetched** -- select query doesn't include `images`, so process photos never display
101. **Likes are client-only** -- `likes: 0` hardcoded, toggleLike only uses local Set, never calls `likes` table or `get_like_count` RPC
102. **No image gallery in detail modal** -- Only shows main image, no thumbnail strip for `images[]`
103. **Hardcoded period sections** -- 3 static periods instead of dynamic from `life_periods` table or artwork dates

---

## Category N: Public Page Missing Features (12 issues)

104. **Experiences page** -- No search/filter by text, only category filter
105. **Favorites page** -- No pagination (could have hundreds of items)
106. **Inspirations page** -- No pagination
107. **LifeTimeline page** -- No category filter (category field exists on life_periods)
108. **ProductReviews page** -- No category filter
109. **Certifications page** -- No filter by status (planned/earned/expired)
110. **Store page** -- Category buttons are display-only (no click-to-filter functionality)
111. **ClientWork page** -- No filter by project_type
112. **Updates page** -- No tag-based filtering
113. **Articles page** -- Check if tag filtering works end-to-end
114. **Writing page** -- Verify it actually aggregates articles + updates
115. **Experiments page** -- No status filter (active/paused/closed/sold)

---

## Category O: Missing Delete Functionality in Editors (8 editors)

Only ArticleEditor and UpdateEditor have inline delete buttons. The rest require going back to the manager to delete:

116. **ExperimentEditor.tsx** -- No delete button
117. **ProductReviewEditor.tsx** -- No delete button
118. **ExperienceEditor.tsx** -- No delete button
119. **CertificationEditor.tsx** -- No delete button
120. **ClientProjectEditor.tsx** -- No delete button
121. **FavoriteEditor.tsx** -- No delete button
122. **InspirationEditor.tsx** -- No delete button
123. **ProductEditor.tsx** -- No delete button

---

## Category P: Editor UndoRedo Inconsistency (4 editors)

Some editors have UndoRedoControls but use `setForm` directly instead of `updateForm` for some fields, bypassing the undo history:

124. **ExperienceEditor.tsx** -- `setForm` used on lines 264, 276, 394-396, 413-414, 432-435 (bypasses `pushToHistory`)
125. **ExperimentEditor.tsx** -- Uses `setForm` everywhere (no `updateForm` wrapper at all), so undo/redo isn't wired despite the component being absent
126. **ArtworkEditor.tsx** -- Same pattern: has UndoRedoControls but many fields bypass history
127. **FavoriteEditor.tsx** -- Same issue

---

## Category Q: Missing Unsaved Changes Warning (11 editors)

Only ArticleEditor and ProjectEditor warn before leaving with unsaved changes (via useEditorShortcuts Escape handler or beforeunload). All other editors allow accidental navigation loss:

128-138. Same 11 editors as Category H.

---

## Category R: Missing `products` Table Verification (1 issue)

139. **Dashboard.tsx line 70** -- Queries `products` table which doesn't appear in the provided schema. ProductsManager, ProductEditor, Store, and StoreProductDetail also query it. If the table doesn't exist, these pages silently fail.

---

## Category S: Admin Manager Search Missing (8 files)

ArticlesManager and UpdatesManager have search fields. Missing from:

140. **ExperimentsManager.tsx** -- No search
141. **ExperiencesManager.tsx** -- No search
142. **CertificationsManager.tsx** -- No search
143. **ClientWorkManager.tsx** -- No search
144. **FavoritesManager.tsx** -- No search
145. **InspirationsManager.tsx** -- No search
146. **LifePeriodsManager.tsx** -- No search
147. **ArtworkManager.tsx** -- No search

---

## Category T: Admin Manager Sorting Missing (10+ files)

No manager pages offer client-side sort controls (by date, name, status):

148. **All manager pages** -- No sort dropdown/toggle. Items are fetched in a fixed order from the query.

---

## Category U: Admin Manager Pagination Missing (10+ files)

No manager pages have pagination. With enough content, lists become unwieldy:

149. **All manager pages with potentially large datasets** -- ExperimentsManager, FavoritesManager, ArtworkManager, InspirationsManager especially.

---

## Category V: Contact Inquiries Admin Page Missing (1 issue)

150. **No admin page for contact_inquiries** -- The Contact form submits to `contact_inquiries` table, but there's no admin page to view/manage incoming messages. The table has RLS for admin SELECT/UPDATE but no UI.

---

## Category W: Email Subscribers Admin Page Missing (1 issue)

151. **No admin page for email_subscribers** -- The SubscribeForm component exists but there's no admin interface to view subscriber list, export emails, or manage subscriptions.

---

## Category X: Supplies Manager Gaps (2 issues)

152. **SuppliesManager.tsx** -- No DuplicateButton (if supplies table supports it)
153. **No SupplyEditor page** -- Unlike other content types, supplies likely use inline editing only

---

## Category Y: Work Logs Not Linked to Projects (1 issue)

154. **TimeTracker.tsx** -- `work_logs.project_id` references projects, but verify the project dropdown actually works and displays project names

---

## Category Z: Funding Campaigns Manager Gaps (2 issues)

155. **FundingCampaignsManager.tsx** -- Verify it has delete confirmation (was it caught in previous batch?)
156. **No public "Fund This Campaign" CTA** -- Support page shows campaigns but individual campaign detail pages don't exist

---

## Category AA: Profile Page Gaps (2 issues)

157. **Profile.tsx** -- Verify it shows user's contributions history
158. **Profile.tsx** -- Check if avatar upload works with storage bucket

---

## Category AB: SEO/Meta Tags Missing (1 issue)

159. **No dynamic meta tags** -- Pages don't set `document.title` or meta description dynamically. ArticleDetail, ProjectDetail, ExperimentDetail etc. should set page titles.

---

## Category AC: Error Handling Gaps (5 issues)

160. **Contact.tsx** -- No email format validation beyond HTML5 `type="email"`
161. **Auth.tsx** -- Verify error messages display properly for login failures
162. **Store page** -- No error state shown when products query fails
163. **Support page** -- No error handling for failed campaign/goal fetches
164. **FundingModal** -- Verify it handles payment errors gracefully

---

## Implementation Priority

**Batch 1 (Critical - 20 items):** Items 1-6 (remaining dialogs, invalidation, duplicate URL bug), items 99-103 (ArtGallery fixes)

**Batch 2 (High - 40 items):** Items 7-19 (clone support in editors), items 20-29 (DuplicateButton in managers), items 116-123 (delete buttons in editors)

**Batch 3 (Medium - 50 items):** Items 38-48 (autosave), items 49-58 (keyboard shortcuts), items 71-81 (draft recovery), items 82-92 (shortcuts help)

**Batch 4 (Enhancement - 40+ items):** Items 93-98 (AI generate buttons), items 104-115 (public page filters/pagination), items 140-149 (admin search/sort/pagination), items 150-164 (missing admin pages, SEO, error handling)

---

## Files to Modify Summary

| Priority | Files | Count |
|----------|-------|-------|
| Batch 1 | EditorToolbar, ExperimentProductEditor, useEditorShortcuts, ExperienceEditor, ProductReviewEditor, ContentLibrary, ArtGallery | 7 |
| Batch 2 | All 13 editors (clone support), 10 managers (DuplicateButton), 8 editors (delete button) | ~20 |
| Batch 3 | 11 editors (autosave + draft recovery + shortcuts + help) | ~11 |
| Batch 4 | 6 editors (AI buttons), 12 public pages (filters), 8 managers (search), new admin pages (contact inquiries, subscribers) | ~25 |

**Total: 164 identified gaps across ~50 files**

