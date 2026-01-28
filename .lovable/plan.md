
# Comprehensive Admin System for LeCompte Portfolio

## Overview

This plan creates a full-featured admin dashboard with traffic analytics, AI-powered content management, bulk import capabilities, lead generation, and complete site control for shanealecompte@gmail.com.

---

## Phase 1: Admin Setup & Access Control

### 1.1 Set Up Admin Role for Email
Create database migration to:
- Insert admin role for `shanealecompte@gmail.com` in `user_roles` table
- Add trigger to auto-assign admin on signup with this email

### 1.2 Admin Dashboard Layout
Create `/admin` route with:
- Sidebar navigation for all admin sections
- Pop art styled dashboard matching site aesthetic
- Quick stats cards (total views, content count, pending drafts, leads)
- Activity feed showing recent changes

---

## Phase 2: Analytics & Traffic Tracking

### 2.1 Database Schema for Analytics
Create new tables:

```text
page_views
├── id (uuid)
├── page_path (text)
├── visitor_id (text) - anonymous fingerprint
├── session_id (text)
├── timestamp (timestamptz)
├── time_on_page_seconds (int)
├── referrer (text)
├── user_agent (text)
├── country (text)
├── city (text)
├── device_type (text)
└── screen_size (text)

link_clicks
├── id (uuid)
├── page_path (text)
├── link_url (text)
├── link_text (text)
├── visitor_id (text)
├── timestamp (timestamptz)
└── session_id (text)

sessions
├── id (text) - session_id
├── visitor_id (text)
├── started_at (timestamptz)
├── ended_at (timestamptz)
├── pages_viewed (int)
├── entry_page (text)
├── exit_page (text)
├── country (text)
└── city (text)
```

### 2.2 Tracking Component
Create `useAnalytics` hook that:
- Generates anonymous visitor fingerprint
- Tracks page views on route change
- Records time-on-page before leaving
- Captures link clicks
- Uses IP geolocation API for location (via edge function)

### 2.3 Analytics Dashboard
Create `/admin/analytics` page with:
- Real-time visitor count
- Traffic charts (daily/weekly/monthly views)
- Geographic heatmap
- Top pages by views and time spent
- Click tracking for all links
- Device/browser breakdown
- Session recordings list (page flow paths)
- Bounce rate and engagement metrics

---

## Phase 3: Full Content Management System

### 3.1 Site Content Table
Create `site_content` table:

```text
site_content
├── id (uuid)
├── section_key (text) - unique identifier e.g. "header.tagline"
├── content_type (enum) - "text" | "rich_text" | "image" | "json"
├── content_value (text)
├── is_draft (boolean)
├── draft_value (text)
├── updated_at (timestamptz)
├── updated_by (uuid)
└── notes (text) - admin notes
```

### 3.2 Content Sections to Manage

**Header & Branding:**
- Site name/logo
- Navigation items
- Contact email

**Home Page:**
- Hero tagline
- Mission statement
- Current projects ticker
- Featured projects selection

**About Page:**
- Biography sections
- Profile image
- Services list
- Areas of interest
- Live projects showcase

**Future Plans:**
- Learning goals (manage from DB)
- Vision board items (manage from DB)

### 3.3 Content Editor Pages
Create admin pages for each content type:
- `/admin/content/site` - Header, footer, global content
- `/admin/content/home` - Homepage sections
- `/admin/content/about` - About page content
- `/admin/projects` - Full project management
- `/admin/articles` - Already exists, enhance
- `/admin/updates` - Already exists, enhance
- `/admin/artwork` - Artwork management
- `/admin/skills` - Skills management
- `/admin/learning-goals` - Learning goals
- `/admin/future-plans` - Future plans items

---

## Phase 4: Enhanced Project Management

### 4.1 Project Editor Enhancements
Update project editor to include:
- Site URL input field
- "Auto-analyze" button that:
  - Fetches site via edge function
  - Extracts screenshots automatically
  - Generates AI description of features
  - Identifies tech stack from source
  - Creates comprehensive portfolio entry

### 4.2 Site Analyzer Edge Function
Create `analyze-site` edge function:
- Uses web scraping to fetch site content
- Takes automated screenshots
- Extracts meta information, colors, fonts
- Detects technology stack
- Generates AI summary of features and purpose
- Returns structured data for project entry

### 4.3 Project Fields to Add

```text
projects (update)
├── screenshots (text[]) - array of image URLs
├── features (text[]) - detected features
├── color_palette (text[]) - extracted colors
├── case_study (rich_text) - full case study content
├── problem_statement (text)
├── solution_summary (text)
├── results_metrics (jsonb)
├── admin_notes (text)
└── next_steps (text)
```

---

## Phase 5: AI Copy Generation

### 5.1 AI Writing Edge Function
Create `generate-copy` edge function using Lovable AI:
- Accepts content type (project, article, update, etc.)
- Accepts context (existing content, style preferences)
- Returns generated copy options
- Supports regeneration and variations

### 5.2 AI Integration Points
Add AI generation buttons to:
- Project descriptions (short and long)
- Article excerpts and content
- Update content
- Artwork descriptions
- About page sections
- Any text field in admin

### 5.3 AI Copy Modal
Create reusable AI copy modal with:
- Tone selection (professional, creative, casual)
- Length options (brief, standard, detailed)
- Generate variations (3 options)
- Edit inline before applying
- Save as draft option

---

## Phase 6: Draft System & Notes

### 6.1 Enhance All Content Tables
Add to projects, articles, updates, artwork:
- `draft_content` (jsonb) - stored draft state
- `admin_notes` (text) - internal notes
- `next_steps` (text) - planned improvements
- `last_saved_draft` (timestamptz)

### 6.2 Admin Notes Section
Create `/admin/notes` page with:
- General brand notes
- Traffic growth ideas
- Content calendar
- Feature wishlist
- Build roadmap for each project
- Marketing ideas

### 6.3 Notes Table

```text
admin_notes
├── id (uuid)
├── category (enum) - brand | marketing | content | traffic | ideas
├── title (text)
├── content (rich_text)
├── priority (int)
├── related_project_id (uuid, nullable)
├── status (enum) - idea | planned | in_progress | done
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

---

## Phase 7: Bulk Import System

### 7.1 Bulk Import Page
Create `/admin/import` with:
- Content type selector (artwork, articles, projects, updates)
- CSV/JSON file upload
- Mapping interface for fields
- Preview before import
- Validation and error reporting
- Progress indicator

### 7.2 Import Templates
Provide downloadable templates for:
- Artwork bulk import (title, category, image_url, description)
- Articles import (title, content, category, tags)
- Updates import (title, content, tags)
- Projects import (all fields)

### 7.3 Image Bulk Upload
For artwork specifically:
- Multi-file image uploader
- Auto-generate titles from filenames
- Category assignment
- AI-powered description generation option

---

## Phase 8: Lead Generation System

### 8.1 Lead Database Tables

```text
leads
├── id (uuid)
├── name (text)
├── company (text)
├── email (text)
├── website (text)
├── linkedin (text)
├── industry (text)
├── company_size (text)
├── location (text)
├── match_score (int) - 0-100
├── match_reasons (text[])
├── source (text) - where found
├── status (enum) - new | contacted | responded | converted | archived
├── notes (text)
├── last_contacted (timestamptz)
├── created_at (timestamptz)
└── updated_at (timestamptz)

lead_searches
├── id (uuid)
├── search_query (text)
├── filters (jsonb)
├── results_count (int)
├── executed_at (timestamptz)
└── status (enum) - pending | completed | failed
```

### 8.2 Lead Finder Edge Function
Create `find-leads` edge function:
- Searches public business directories
- Matches against your brand/skills profile
- Scores relevance based on:
  - Industry alignment (T1D, art, tech)
  - Company size (small businesses, startups)
  - Location preferences
  - Service needs (web dev, design, content)
- Returns structured lead data

### 8.3 Lead Dashboard
Create `/admin/leads` page with:
- Lead search interface with filters
- Industry/company size/location selectors
- "Find Matches" button
- Results grid with match scores
- Lead detail modal with:
  - Full company analysis
  - Contact information
  - LinkedIn links
  - Website analysis
  - Suggested outreach approach
- Status tracking pipeline
- Export to CSV
- Last search history

### 8.4 Lead Update Scheduler
Create scheduled edge function that:
- Runs weekly or on-demand
- Searches for new potential leads
- Updates existing lead information
- Notifies admin of new high-match leads

---

## Phase 9: Account Management

### 9.1 Admin Profile Settings
Create `/admin/settings` page with:
- Change password functionality
- Email preferences
- Notification settings
- API keys management
- Export all data

### 9.2 Activity Log Table

```text
admin_activity_log
├── id (uuid)
├── user_id (uuid)
├── action (text) - e.g. "updated_project", "generated_ai_copy"
├── entity_type (text)
├── entity_id (uuid)
├── details (jsonb)
├── ip_address (text)
└── created_at (timestamptz)
```

### 9.3 Activity Dashboard
Show in admin overview:
- Recent actions with timestamps
- Content modification history
- Login history
- AI usage stats

---

## Phase 10: Navigation & UI

### 10.1 Admin Sidebar Navigation
```text
Dashboard
├── Overview (stats, activity)
├── Analytics (traffic, clicks)
│
Content
├── Site Settings (header, footer, global)
├── Home Page
├── About Page
├── Projects
├── Articles
├── Updates
├── Artwork
├── Skills
├── Learning Goals
├── Future Plans
│
Tools
├── AI Copy Generator
├── Bulk Import
├── Lead Finder
├── Notes & Ideas
│
Account
├── Settings
├── Activity Log
└── Sign Out
```

### 10.2 Admin Layout Component
Create `AdminLayout` with:
- Collapsible sidebar
- Top bar with quick actions
- Notification center
- Search across all content

---

## Technical Implementation Details

### Edge Functions to Create

1. **analyze-site** - Fetches and analyzes websites
2. **generate-copy** - AI copy generation via Lovable AI
3. **find-leads** - Lead discovery and matching
4. **geolocate-ip** - Visitor location lookup
5. **update-leads** - Scheduled lead refresh

### New Components

1. `AdminLayout.tsx` - Dashboard wrapper
2. `AdminSidebar.tsx` - Navigation sidebar
3. `ContentEditor.tsx` - Generic content editor
4. `AIWriterModal.tsx` - AI copy generation interface
5. `BulkImporter.tsx` - Import wizard
6. `LeadCard.tsx` - Lead display component
7. `AnalyticsChart.tsx` - Traffic visualization
8. `DraftIndicator.tsx` - Shows draft status
9. `NotesEditor.tsx` - Admin notes interface
10. `useAnalytics.tsx` - Tracking hook

### New Pages (in /admin/)

1. `Dashboard.tsx` - Main overview
2. `Analytics.tsx` - Traffic analytics
3. `SiteContent.tsx` - Global content
4. `HomeContent.tsx` - Home page editor
5. `AboutContent.tsx` - About page editor
6. `ProjectEditor.tsx` - Enhanced project editor
7. `ArtworkManager.tsx` - Artwork CRUD
8. `SkillsManager.tsx` - Skills CRUD
9. `LearningGoalsManager.tsx` - Learning goals
10. `FuturePlansManager.tsx` - Future plans
11. `BulkImport.tsx` - Import interface
12. `LeadFinder.tsx` - Lead generation
13. `Notes.tsx` - Admin notes
14. `Settings.tsx` - Account settings
15. `ActivityLog.tsx` - Action history

---

## Database Migrations Required

1. Create `page_views` table
2. Create `link_clicks` table
3. Create `sessions` table
4. Create `site_content` table
5. Create `admin_notes` table
6. Create `leads` table
7. Create `lead_searches` table
8. Create `admin_activity_log` table
9. Update `projects` table with new fields
10. Update `articles`, `updates`, `artwork` with draft fields
11. Add admin role for specific email
12. RLS policies for all new tables (admin only)

---

## Implementation Order

1. **Week 1**: Admin setup, dashboard layout, basic navigation
2. **Week 2**: Content management for all sections
3. **Week 3**: Analytics tracking and visualization
4. **Week 4**: AI integration and copy generation
5. **Week 5**: Project analyzer and bulk import
6. **Week 6**: Lead generation system
7. **Week 7**: Notes, drafts, and refinements
8. **Week 8**: Testing, polish, and documentation

---

## Security Considerations

- All admin routes protected by `has_role()` check
- RLS policies restrict all new tables to admin only
- Activity logging for audit trail
- Rate limiting on AI and lead finding endpoints
- Secure password change with email verification
- Session management with proper token handling
