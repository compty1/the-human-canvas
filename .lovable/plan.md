

# Enhanced Content & Leads System Plan (Updated)

## Overview

This updated plan includes all previous features PLUS two new requirements:
1. **Skills-Based Lead Discovery** - Allow entering skills and terms as optional guide to auto-find opportunities
2. **Dates on Portfolio Items** - Add start_date to projects and display dates for all portfolio items

---

## Part 1: Current Build Issues Identified

### Issue 1: Console Warnings - forwardRef Missing
**Status**: Needs Fix
**Files**: `src/components/pop-art/HalftoneImage.tsx`, `src/components/pop-art/Ticker.tsx`
**Fix**: Add forwardRef wrapper to both components.

### Issue 2: Ticker Items Not Database-Driven  
**Status**: Broken
**File**: `src/pages/Index.tsx`
**Fix**: Fetch ticker items from `site_content` table.

### Issue 3: Artwork Images Not Displaying in Admin
**File**: `src/pages/admin/ArtworkManager.tsx`
**Fix**: Add `resolveImageUrl` helper.

### Issue 4: BulkTextImporter Fails on Large Text (30k words)
**Files**: `src/components/admin/BulkTextImporter.tsx`, `supabase/functions/generate-copy/index.ts`
**Fix**: Add chunking, better error handling, file upload support.

### Issue 5: Index.tsx Uses Hardcoded Projects
**File**: `src/pages/Index.tsx`  
**Fix**: Fetch featured projects from database.

### Issue 6: Lead Finder Missing Critical Features
**Fix**: Full detail pages, AI chat, accept/plan workflow.

### Issue 7: No Content Review/Approval Workflow
**Fix**: Add review status, central review UI.

### Issue 8: No Scheduled Publishing  
**Fix**: Add scheduled_at fields, cron edge function.

### Issue 9: Experiments Missing Case Study
**Fix**: Already added in previous migration.

### Issue 10: Projects Missing start_date (NEW)
**Problem**: Projects table lacks `start_date` column - can't show when projects began.
**Evidence**: Schema shows no start_date, but experiments and client_projects have it.
**Fix**: Add `start_date` and `end_date` columns to projects table.

### Issue 11: Lead Finder Uses Hardcoded Skills (NEW)
**Problem**: The find-leads edge function has hardcoded portfolio skills instead of fetching from the skills table dynamically.
**Evidence**: Lines 91-97 in find-leads/index.ts show hardcoded skills list.
**Fix**: Fetch skills from database AND allow user to input custom skills/terms for search.

---

## Part 2: Implementation Plan

### Phase 1: Fix Existing Bugs (Priority: High)

#### 1.1 Fix Console Warnings
Add forwardRef to HalftoneImage and Ticker components.

#### 1.2 Fix Artwork Display in Admin
Add `resolveImageUrl` helper to ArtworkManager.tsx.

#### 1.3 Make Index.tsx Database-Driven
- Fetch `ticker_items` from site_content
- Fetch featured projects from database
- Replace hardcoded arrays

---

### Phase 2: Add Dates to Projects (NEW)

#### 2.1 Database Migration
Add date columns to projects table:
```sql
ALTER TABLE projects ADD COLUMN start_date DATE;
ALTER TABLE projects ADD COLUMN end_date DATE;
```

#### 2.2 Update ProjectEditor Admin Page
Add start_date and end_date fields to the project editor form with date pickers.

#### 2.3 Update Projects.tsx Public Page
Display dates on project cards:
- For "live" projects: Show launch date (end_date or start_date)
- For "in_progress" projects: Show "Started [start_date]"
- For "planned" projects: Show expected start if set

#### 2.4 Update ProjectDetail.tsx
Display project timeline section with:
- Started: [start_date]
- Completed/Launched: [end_date]
- Duration calculation

#### 2.5 Update Other Portfolio Pages
Add date display to:
- `src/pages/Experiments.tsx` - Already has start_date, ensure visible
- `src/pages/ClientWork.tsx` - Already has start_date, ensure visible
- `src/pages/ClientProjectDetail.tsx` - Show full date range

---

### Phase 3: Enhanced BulkTextImporter for 30k Words

#### 3.1 Update BulkTextImporter Component
- Increase maxLength to 150,000 characters (~30,000 words)
- Add progress indicator for large text
- Add chunking logic for texts over 10,000 characters
- Add file upload capability (.txt, .md, .docx)
- Better error handling for timeouts

#### 3.2 Update generate-copy Edge Function
- Add chunking support for large texts
- Process in batches and merge results
- Handle 429/402 errors gracefully

---

### Phase 4: Add Case Studies to Experiments

#### 4.1 Update ExperimentEditor
Add case study rich text editor section.

#### 4.2 Update ExperimentDetail Public Page
Display case study section with proper formatting.

---

### Phase 5: Content Review & Approval System

#### 5.1 Database Updates
Already added `review_status`, `scheduled_at`, `reviewer_notes` in previous migration.

#### 5.2 Create ContentReviewManager Admin Page
Central dashboard showing all pending content across types.

#### 5.3 Update Content Editors
Add review workflow controls to all editors.

---

### Phase 6: Scheduled Publishing

#### 6.1 Create Scheduled Publisher Edge Function
Edge function that runs periodically to auto-publish approved scheduled content.

#### 6.2 Add Scheduling UI
Date/time picker in all content editors.

---

### Phase 7: Skills-Based Lead Discovery (NEW)

#### 7.1 Create Lead Search Profile Table
```sql
CREATE TABLE lead_search_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  terms TEXT[] DEFAULT '{}', 
  industries TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_search_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage search profiles" 
ON lead_search_profiles FOR ALL 
USING (has_role(auth.uid(), 'admin'));
```

#### 7.2 Update LeadFinder UI
Add new section for skills/terms input:
- **Skills Tags Input**: Multi-select or tag input for skills
- **Custom Terms Input**: Free-form text input for specific terms
- **Auto-populate from Skills**: Button to fetch skills from skills table
- **Save as Profile**: Save skill/term combinations for reuse
- **Load Profile**: Select saved profiles for quick searches

UI Layout:
```
┌───────────────────────────────────────────────────────────┐
│  Lead Finder                                               │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │ My Skills & Expertise                                │  │
│  │ [React] [TypeScript] [UX Design] [+Add]             │  │
│  │ ○ Auto-load from Skills Manager                     │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Custom Search Terms                                  │  │
│  │ [diabetes tech] [health apps] [+Add]                │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Lead Type: ( ) Work  ( ) Partnership  ( ) Org       │  │
│  │ Industry: [________]  Location: [________]          │  │
│  └─────────────────────────────────────────────────────┘  │
│  [Find Leads] [Save Profile ▼]                            │
└───────────────────────────────────────────────────────────┘
```

#### 7.3 Update find-leads Edge Function
Modify to accept skills/terms from request instead of hardcoded:
```typescript
interface FindLeadsRequest {
  skills?: string[];        // NEW: User's skills
  searchTerms?: string[];   // NEW: Custom search terms
  industry?: string;
  location?: string;
  companySize?: string;
  leadType?: "work" | "partnership" | "organization";
  limit?: number;
}
```

Update prompt to dynamically include:
- Skills from request (or fetch from skills table if empty)
- Custom search terms for more targeted results
- Better matching based on actual portfolio content

#### 7.4 Auto-Discovery Feature
Add "Auto Find Opportunities" button that:
1. Fetches all skills from skills table
2. Analyzes recent projects/experiments for relevant terms
3. Automatically triggers lead search with combined data
4. Presents curated opportunities without manual input

---

### Phase 8: Enhanced Lead System

#### 8.1 Create LeadDetail Page
Full detail page at `/admin/leads/:id` with:
- Company/individual info
- Estimated pay/costs breakdown
- Work required description
- AI chat for discussing opportunity
- Accept/reject actions
- Plan creation

#### 8.2 Create Lead Plans Editor
For accepted leads:
- Project timeline
- Step-by-step tasks
- AI-suggested next steps
- Benefits tracking
- Milestones

#### 8.3 Create AI Lead Advisor Edge Function
- Analyze opportunities
- Suggest pricing strategies
- Generate plan steps
- Recommend actions

---

### Phase 9: AI Chat for Content Creation

#### 9.1 Create AI Chat Component
Reusable `AIChatAssistant` component.

#### 9.2 Add to Content Editors
Integrate AI chat sidebar to all editors.

#### 9.3 Create Edge Function
`ai-assistant` for conversational content help.

---

## File Changes Summary

### New Files to Create
1. `src/pages/admin/ContentReviewManager.tsx` - Central review dashboard
2. `src/pages/admin/LeadDetail.tsx` - Full lead detail page
3. `src/components/admin/LeadPlanEditor.tsx` - Plan editor component
4. `src/components/admin/SkillsTermsInput.tsx` - Skills/terms tag input (NEW)
5. `src/components/admin/LeadSearchProfile.tsx` - Profile save/load (NEW)
6. `supabase/functions/ai-assistant/index.ts` - Content AI chat
7. `supabase/functions/ai-lead-advisor/index.ts` - Lead AI
8. `supabase/functions/scheduled-publisher/index.ts` - Auto-publish cron

### Files to Modify
1. `src/components/pop-art/HalftoneImage.tsx` - Add forwardRef
2. `src/components/pop-art/Ticker.tsx` - Add forwardRef
3. `src/pages/Index.tsx` - Database-driven content
4. `src/pages/admin/ArtworkManager.tsx` - Fix image resolution
5. `src/components/admin/BulkTextImporter.tsx` - Large text + file upload
6. `supabase/functions/generate-copy/index.ts` - Chunking support
7. `src/pages/admin/ExperimentEditor.tsx` - Add case study section
8. `src/pages/ExperimentDetail.tsx` - Display case study
9. `src/pages/admin/LeadFinder.tsx` - Skills/terms input, tabs, profiles (NEW)
10. `supabase/functions/find-leads/index.ts` - Dynamic skills/terms (NEW)
11. `src/pages/Projects.tsx` - Display dates (NEW)
12. `src/pages/ProjectDetail.tsx` - Display timeline (NEW)
13. `src/pages/admin/ProjectEditor.tsx` - Add date fields (NEW)
14. `src/pages/Experiments.tsx` - Ensure dates visible (NEW)
15. `src/pages/ClientWork.tsx` - Ensure dates visible (NEW)
16. `src/components/admin/AdminLayout.tsx` - Add Content Review nav item
17. `src/App.tsx` - Add new routes

### Database Migrations
1. Add `start_date`, `end_date` to projects table (NEW)
2. Create `lead_search_profiles` table (NEW)
3. Add `case_study` to experiments (already done)
4. Add review fields to content tables (already done)
5. Add lead enhancement columns (already done)
6. Create `lead_plans` table (already done)

---

## Implementation Order

1. **Phase 1**: Fix existing bugs (console warnings, artwork display, Index.tsx)
2. **Phase 2**: Add dates to projects (NEW - database + UI)
3. **Phase 3**: Enhance BulkTextImporter for large text + file uploads
4. **Phase 4**: Add case studies to experiments
5. **Phase 5**: Content review system (UI)
6. **Phase 6**: Scheduled publishing (cron function)
7. **Phase 7**: Skills-based lead discovery (NEW - database + UI + edge function)
8. **Phase 8**: Enhanced lead system (detail pages, plans)
9. **Phase 9**: AI chat for content creation

---

## Expected Outcome

After implementation:
- All projects show start/end dates with "Started..." for in-progress
- Experiments and client work display date ranges
- Lead Finder allows entering custom skills and terms
- Leads auto-discovered based on portfolio content
- Saved search profiles for quick re-use
- BulkTextImporter handles 30k+ words with chunking
- Content review dashboard shows all pending content
- Scheduled publishing works automatically
- AI chat available in all content editors
- Lead detail pages with full info, costs, plans

