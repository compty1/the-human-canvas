

# Comprehensive Plan: Life Period Categories, 60+ New Gaps, Knowledge Base Audit, Content Management Audit, and Media Library Audit

This plan keeps all items from the previously approved plan and adds 160+ additional gaps organized by system.

---

## New Feature: Life Period Categories

### Database Migration
```text
ALTER TABLE life_periods ADD COLUMN category text DEFAULT 'uncategorized';
```

### Changes
1. **`src/pages/admin/LifePeriodEditor.tsx`** -- Add a category `<select>` dropdown with predefined categories (e.g., "Creative", "Professional", "Personal", "Educational", "Transitional", "Uncategorized") plus an "Other" option with a free-text input for custom categories. Allow admin to type new category names.

2. **`src/pages/admin/LifePeriodsManager.tsx`** -- Add category filter dropdown above the timeline. Show category badge on each period card. Add ability to rename categories across all periods (bulk update). Add delete category option that moves periods to "Uncategorized".

3. **`src/pages/LifeTimeline.tsx`** -- Show category badge on each period card. Add category filter for public viewing.

4. **`src/pages/LifePeriodDetail.tsx`** -- Display category badge.

---

## Previously Approved Items (Kept As-Is)

All 90 gaps from the previous plan remain:
- Category A: Media Usage Tracking (Gaps 1-8)
- Category B: Storage Scanning (Gaps 9-14)
- Category C: KnowledgeEntryWidget missing from 7 editors (Gaps 15-21)
- Category D: Knowledge Base Page Gaps (Gaps 22-24)
- Category E: ArtGallery Public Page Gaps (Gaps 25-30)
- Category F: AddToContentModal Gaps (Gaps 31-34)
- Category G: Editor Consistency Gaps (Gaps 35-49)
- Category H: Content Sync/Cross-Reference (Gaps 50-56)
- Category I: Public Page Rendering (Gaps 57-63)
- Category J: Media Library Folders (Gaps 64-69)
- Category K: AI Photo Analysis (Gaps 70-74)
- Category L: Bulk Delete Duplicates (Gaps 75-78)
- Category M: Tagging System (Gaps 79-84)
- Category N: Console Errors and Type Issues (Gaps 85-90)

---

## NEW: Knowledge Base Audit (40 Gaps) -- Category O

### Data Integrity (O1-O10)
91. **No pagination** -- KnowledgeBase.tsx fetches ALL entries with no limit; will break at scale
92. **No entity_id set on manual entries** -- When creating entries manually in KnowledgeBase.tsx, `entity_id` is never set, making them orphans
93. **No metadata field used** -- The `knowledge_entries.metadata` jsonb column exists in schema but is never read or written anywhere
94. **No images field used** -- The `knowledge_entries.images` text[] column exists but is never populated or displayed
95. **entity_type "update" missing from ENTITY_TYPES** -- KnowledgeBase.tsx and widget lack "update" as an option
96. **entity_type "artwork" missing from ENTITY_TYPES** -- Not in the ENTITY_TYPES array in KnowledgeBase.tsx
97. **entity_type "certification" missing from ENTITY_TYPES** -- Not listed
98. **No updated_at displayed** -- Entries show `created_at` but never `updated_at`, so edits appear stale
99. **Duplicate entries possible** -- No uniqueness check on title+entity_id; same AI insight can be saved multiple times
100. **No confirmation before delete** -- Single-click delete with no "Are you sure?" dialog

### Widget Gaps (O11-O20)
101. **Widget doesn't show entity link** -- No way to navigate to the parent entity from a knowledge entry
102. **Widget category select missing "ai_generated"** -- Already noted but specifically in KnowledgeEntryWidget.tsx line 163-169
103. **Widget has no edit capability** -- Can only add and delete; cannot edit existing entries inline
104. **Widget doesn't show images** -- Even if images are saved, they're not rendered
105. **Widget doesn't show metadata** -- jsonb metadata never displayed
106. **Widget query doesn't invalidate cross-page** -- Uses `["knowledge-entries", entityType, entityId]` key, but KnowledgeBase page uses `["knowledge-base-all"]`, so adding via widget doesn't refresh the main KB page without navigation
107. **No bulk delete in widget** -- Can only delete one at a time
108. **No search in widget** -- When many entries exist for one entity, no way to filter
109. **No sort in widget** -- Entries always sorted by created_at desc, no alternative
110. **Widget collapsed by default** -- Easy to forget it exists; no indicator of entry count when collapsed (actually there is a count badge, but it only shows when there are entries)

### AI Chat to KB Integration (O21-O30)
111. **Save to KB uses generic title** -- Always "AI Insight: {entityTitle}" with no customization
112. **No preview before saving to KB** -- Saves immediately without letting user edit title/content
113. **Saved KB entries have no source reference** -- No way to trace back which conversation the insight came from
114. **No way to save user messages to KB** -- Only assistant messages have the "Save to Knowledge Base" button
115. **Duplicate save detection missing** -- Same message can be saved to KB multiple times
116. **KB invalidation key mismatch** -- ItemAIChatPanel invalidates `["knowledge-entries"]` (partial match) but widget uses exact `["knowledge-entries", entityType, entityId]`
117. **No way to view KB entries from chat** -- Chat panel doesn't show existing knowledge entries for context
118. **AI chat doesn't receive KB context** -- When sending messages, existing knowledge entries for the entity aren't included in the AI context
119. **No way to edit KB entry after saving from chat** -- Must go to KnowledgeBase page to edit
120. **Chat conversations don't auto-title well** -- Uses first 60 chars of first message, often truncated mid-word

### KB Page UX (O31-O40)
121. **No bulk operations** -- Can't bulk delete, bulk re-categorize, or bulk tag entries
122. **No export capability** -- Can't export knowledge base to JSON/CSV
123. **No import capability** -- Can't bulk import entries
124. **No entry detail view** -- Content is truncated to 3 lines with no way to expand inline
125. **No rich text support** -- Content is plain text only; no formatting
126. **Tags are display-only** -- Clicking a tag doesn't filter by that tag
127. **No entry count by category** -- Category filter doesn't show counts like type filter does
128. **No date range filter** -- Can't filter entries by when they were created
129. **No sorting options** -- Always sorted by created_at desc; can't sort by title, type, or category
130. **Delete has no undo** -- Once deleted, entries are gone permanently with no recovery

---

## NEW: Content Management Audit (40 Gaps) -- Category P

### Editor Consistency (P1-P15)
131. **ArticleEditor uses basic file input for featured_image** -- Not EnhancedImageManager or even ImageUploader component
132. **UpdateEditor has no image support** -- No featured image field at all despite other content types having one
133. **FavoriteEditor has no KnowledgeEntryWidget** -- Confirmed missing
134. **InspirationEditor has no KnowledgeEntryWidget** -- Confirmed missing
135. **CertificationEditor has no KnowledgeEntryWidget** -- Confirmed missing
136. **ArtworkEditor has no KnowledgeEntryWidget** -- Confirmed missing
137. **ArticleEditor has no KnowledgeEntryWidget** -- Confirmed missing
138. **LifePeriodEditor has no KnowledgeEntryWidget** -- Confirmed missing
139. **UpdateEditor has no KnowledgeEntryWidget** -- Confirmed missing
140. **LifePeriodEditor uses MultiImageUploader** -- Should use EnhancedImageManager for drag-reorder
141. **InspirationEditor uses MultiImageUploader** -- Should use EnhancedImageManager
142. **ArtworkEditor has no undo/redo** -- No UndoRedoControls or useFormHistory
143. **LifePeriodEditor has no undo/redo** -- Missing
144. **FavoriteEditor has no undo/redo** -- Missing
145. **CertificationEditor has no undo/redo** -- Missing

### Content Workflow (P16-P25)
146. **Life periods have no review_status** -- No draft/published workflow unlike articles, experiments, etc.
147. **Artwork has no review_status** -- No workflow status
148. **Favorites have no review_status** -- No workflow
149. **Certifications have no review_status** -- No workflow
150. **Inspirations have no review_status** -- No workflow
151. **Skills have no review_status or published flag** -- Always public
152. **Content Library page may not list life_periods** -- Need to verify it shows all content types
153. **Scheduled publishing only works for articles, experiments, product_reviews, updates** -- Other types lack `scheduled_at` column
154. **No "Archive" status for life_periods** -- Can't archive old periods
155. **No slug field on life_periods** -- Uses ID in URL instead of a human-readable slug

### Query Key Inconsistencies (P26-P35)
156. **ArtworkEditor uses `admin-artwork` key** -- but ArtGallery uses `artwork-gallery`; editor saves don't refresh gallery
157. **LifePeriodEditor uses `admin-life-periods`** -- but LifeTimeline uses `life-periods`; no cross-invalidation
158. **ExperimentEditor uses `admin-experiments`** -- but ExperimentDetail uses `experiment-{slug}`; stale after edits
159. **ProjectEditor uses `admin-projects`** -- but ProjectDetail uses `project-{slug}`; stale
160. **ArticleEditor uses `admin-articles`** -- but ArticleDetail uses `article-{slug}`; stale
161. **FavoriteEditor uses `admin-favorites`** -- but Favorites page uses `favorites`; no cross-invalidation
162. **CertificationEditor uses `admin-certifications`** -- but Certifications page uses `certifications`; stale
163. **InspirationEditor uses `admin-inspirations`** -- but Inspirations page uses `inspirations`; stale
164. **ClientProjectEditor uses `admin-client-projects`** -- but ClientWork page uses `client-projects`; stale
165. **UpdateEditor uses `admin-updates`** -- but Updates page uses `updates`; stale

### Content Deletion Cascades (P36-P40)
166. **Deleting artwork leaves orphaned knowledge_entries** -- entity_type "artwork" entries persist
167. **Deleting experiments leaves orphaned ai_conversations** -- entity_type/entity_id references stale
168. **Deleting any content leaves orphaned ai_conversations** -- No cascade cleanup anywhere
169. **Deleting content doesn't clean media_library references** -- "In Use" badge stays inaccurate
170. **No soft delete / trash bin** -- All deletions are permanent with no recovery across all managers

---

## NEW: Media Library Audit (40 Gaps) -- Category Q

### Usage Tracking Missing Tables (Q1-Q8) -- Same as Category A
171-178: (Already covered in gaps 1-8: life_periods, certifications, client_projects, product_reviews, artwork.images[])

### Storage Scanning (Q9-Q14) -- Same as Category B
179-184: (Already covered in gaps 9-14)

### Functionality Gaps (Q15-Q30)
185. **No folder system** -- Covered in plan (gaps 64-69)
186. **No bulk move to folder** -- Part of folder feature
187. **Upload doesn't capture width/height** -- `width` and `height` columns always null for uploaded images
188. **No image preview/lightbox** -- Clicking an image selects it; no full-screen preview
189. **Select all button missing** -- No "Select All" or "Select All Visible" button
190. **No deselect all except the X button** -- Could use Ctrl+A or a checkbox in header
191. **Drag-reorder only works for library items** -- Storage-only items can't be reordered (by design, but confusing)
192. **No "Import to Library" for storage-only items** -- Storage items can't be promoted to library entries to enable tagging/renaming
193. **Crop saves as new file** -- No option to replace original
194. **Edit operations (rotate, removeBg, autoCrop) fail silently on CORS** -- Error is shown but not specific about which images failed
195. **No image dimensions shown** -- Width/height not displayed even when available
196. **Rename doesn't update references** -- Renaming a library item's filename doesn't update any content table URLs
197. **Delete doesn't check "In Use" status** -- Can delete images actively used by content with no warning
198. **No confirmation dialog for bulk delete** -- Clicking trash immediately deletes
199. **Copy URL doesn't indicate which URL** -- No visual feedback beyond toast
200. **Sort state resets on page navigation** -- Sort preference not persisted

### Duplicate Detection (Q31-Q35)
201. **Duplicate detection over-matches** -- UUID prefix stripping is too aggressive; files like `a.jpg` and `b.jpg` could false-match if both have UUIDs stripped to empty
202. **No side-by-side comparison view** -- Can't visually compare suspected duplicates
203. **No "Keep Best" logic** -- Duplicate deletion has no way to compare quality/size before choosing which to keep
204. **Bulk delete duplicates button missing** -- Covered in plan (gaps 75-78)
205. **No URL-based deduplication** -- Two library entries with same URL are possible

### Tagging Gaps (Q36-Q40)
206. **No remove-tag-from-single-item UI** -- Can add tags but not remove from individual items
207. **Auto-categorize fails for storage-only items** -- They can't be tagged, but error messaging is poor
208. **No tag management/rename page** -- Can't rename or merge tags globally
209. **Tag filter resets on view mode change** -- Switching grid/grouped may lose filter state
210. **No tag suggestions while typing** -- New tag input has no autocomplete from existing tags

---

## NEW: Additional Cross-Cutting Gaps (Category R)

### Public Pages (R1-R15)
211. **ArtGallery doesn't fetch artwork.images[]** -- Only fetches `image_url`; gallery detail modal only shows main image
212. **ArtGallery likes are client-side only** -- Uses local Set; never calls database `likes` table
213. **ArtGallery period sections hardcoded** -- Year ranges (2011-2014, 2015-2019, 2020-Present) hardcoded instead of from life_periods
214. **ArtGallery categories don't include "portrait", "landscape", "pop_art"** -- ArtworkEditor has these but ArtGallery filter list doesn't
215. **ArticleDetail likes are client-side only** -- Same pattern as ArtGallery
216. **UpdateDetail likes are client-side only** -- Same pattern
217. **ExperienceDetail doesn't exist as a separate detail page** -- Listed in files but need to verify it renders screenshots gallery
218. **FavoriteDetail streaming links rendering untested** -- May not work for all platform types
219. **ClientProjectDetail may not render screenshots gallery** -- Need to verify
220. **InspirationDetail shows images gallery** -- Need to verify it displays the `images[]` array (the schema has it)
221. **LifeTimeline doesn't show category** -- Will need update after adding category column
222. **No breadcrumb navigation on detail pages** -- Users can only go "Back" not navigate hierarchy
223. **No related content on detail pages** -- No "Related Projects" or "Other artwork from this period" sections
224. **No share buttons on public detail pages** -- No social sharing
225. **No SEO meta tags on public pages** -- No Open Graph or Twitter card tags

### Navigation and Routing (R16-R20)
226. **No 404 handling for invalid entity IDs** -- Detail pages show generic "Not Found" but don't distinguish between "doesn't exist" and "not published"
227. **Life periods use UUID in URL** -- `/timeline/{uuid}` instead of a slug-based URL
228. **No back button state preservation** -- Going back from a detail page loses filter/scroll position
229. **Admin sidebar doesn't highlight life-periods route** -- May not match the active route pattern
230. **No loading skeleton on detail pages** -- Most use Loader2 spinner instead of content skeleton

### Data Consistency (R21-R30)
231. **life_periods.key_works stores UUIDs** -- But no foreign key constraint; can reference deleted artwork
232. **No validation on date ranges** -- end_date can be before start_date
233. **No duplicate slug detection** -- Articles, projects, experiments don't check for unique slugs before save
234. **experiment_products.experiment_id has no cascade** -- Deleting experiment doesn't auto-delete its products
235. **funding_campaigns.project_id has no cascade** -- Deleting project doesn't clean up campaigns
236. **No character limit validation** -- Title, description fields have no max-length checks
237. **Tags arrays can have duplicates** -- No dedup logic when adding tags
238. **Empty string values saved instead of null** -- Some editors save `""` instead of `null` for optional fields
239. **Order index not auto-incremented** -- New items default to 0, causing sort collisions
240. **is_current flag not enforced uniquely** -- Multiple life periods can be "current" if database is edited directly

### Performance (R31-R35)
241. **Media library fetches ALL items on mount** -- No pagination; will be slow at 500+ items
242. **Usage tracking queries 7 tables on every media library load** -- No caching strategy
243. **Knowledge base fetches all entries** -- No pagination or virtual scrolling
244. **AI conversations not paginated** -- All conversations for an entity loaded at once
245. **No lazy loading for image thumbnails in editors** -- All gallery images load immediately

---

## Summary of All Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/MediaLibrary.tsx` | Usage tracking (8 tables), storage scan (6 folders), folders, bulk delete duplicates, analyze button, import-to-library, select all, delete confirmation, tag removal, image preview |
| `src/pages/admin/KnowledgeBase.tsx` | Add "ai_generated" + "update" + "artwork" + "certification" to categories/types, pagination, inline expand, tag click-to-filter, category counts, sorting, entry detail view, bulk operations |
| `src/components/admin/KnowledgeEntryWidget.tsx` | Add "ai_generated" category, edit capability, search, KB context display, invalidation fix |
| `src/components/admin/ItemAIChatPanel.tsx` | Editable title before KB save, duplicate detection, include KB context in AI messages, conversation auto-title fix |
| `src/pages/admin/LifePeriodEditor.tsx` | Add category field, KnowledgeEntryWidget, switch MultiImageUploader to EnhancedImageManager, add undo/redo |
| `src/pages/admin/LifePeriodsManager.tsx` | Category filter, category badge, rename/delete categories |
| `src/pages/LifeTimeline.tsx` | Show category badge, category filter |
| `src/pages/LifePeriodDetail.tsx` | Show category badge |
| `src/pages/ArtGallery.tsx` | Fetch images[], wire likes to DB, dynamic categories, dynamic period sections |
| `src/pages/admin/ArtworkEditor.tsx` | Add KnowledgeEntryWidget, undo/redo |
| `src/pages/admin/ArticleEditor.tsx` | Add KnowledgeEntryWidget |
| `src/pages/admin/UpdateEditor.tsx` | Add KnowledgeEntryWidget |
| `src/pages/admin/FavoriteEditor.tsx` | Add KnowledgeEntryWidget, undo/redo |
| `src/pages/admin/InspirationEditor.tsx` | Add KnowledgeEntryWidget, switch to EnhancedImageManager |
| `src/pages/admin/CertificationEditor.tsx` | Add KnowledgeEntryWidget, undo/redo |
| `src/components/admin/AddToContentModal.tsx` | Fix error handling, improve success messages |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/analyze-media/index.ts` | AI photo analysis edge function |

## Database Migration

```text
ALTER TABLE life_periods ADD COLUMN category text DEFAULT 'uncategorized';
ALTER TABLE media_library ADD COLUMN folder text DEFAULT NULL;
```

## Implementation Priority

1. Database migrations (life_periods.category, media_library.folder)
2. Life period categories (editor, manager, public pages)
3. Knowledge Base fixes (categories, pagination, widget gaps, AI chat integration)
4. KnowledgeEntryWidget added to 7 missing editors
5. Media library usage tracking + storage scanning
6. Media library folders
7. Bulk delete duplicates
8. ArtGallery public page fixes (images[], likes, categories)
9. Content management query key fixes
10. Editor consistency (EnhancedImageManager, undo/redo)
11. Create analyze-media edge function
12. Remaining UX improvements

