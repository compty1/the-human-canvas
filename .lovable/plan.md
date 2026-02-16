
# AI Content Dashboard - Full Implementation Plan

## Overview

Build a new "AI Content Hub" page at `/admin/content-hub` that serves as a central command center for managing all site content through an AI-powered chat interface. The AI reads actual database content, generates actionable plans with one-click implementation, tracks all changes with undo/revert capability, and supports pasting raw content for AI-assisted placement.

---

## Architecture

The system has 4 major components:

1. **AI Content Hub page** - Split-panel layout with chat on right, dashboard on left
2. **Enhanced edge function** - New `ai-content-hub` function that receives full site context and returns structured action plans
3. **Database tables** - Store conversations, plans, and change history
4. **Action executor** - Client-side logic that reads AI plans and executes database operations

---

## Database Changes

### New Tables

**`ai_conversations`** - Stores chat sessions
- `id` (UUID, PK)
- `title` (text) - auto-generated from first message
- `messages` (JSONB) - array of {role, content, timestamp}
- `created_at`, `updated_at` (timestamptz)

**`ai_content_plans`** - Stores generated plans (pending, saved, executed)
- `id` (UUID, PK)
- `conversation_id` (UUID, FK to ai_conversations)
- `title` (text)
- `description` (text)
- `actions` (JSONB) - array of {type: "create"|"update"|"delete", table, id?, data, field_changes}
- `status` (text) - "pending" | "saved" | "executed" | "reverted"
- `executed_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**`ai_change_history`** - Tracks every change made through the AI hub for undo
- `id` (UUID, PK)
- `plan_id` (UUID, FK to ai_content_plans)
- `action_type` (text) - "create" | "update" | "delete"
- `table_name` (text)
- `record_id` (UUID)
- `previous_data` (JSONB, nullable) - snapshot before change
- `new_data` (JSONB) - what was applied
- `reverted` (boolean, default false)
- `created_at` (timestamptz)

All tables have RLS policies allowing only admin users.

---

## New Files

### 1. `src/pages/admin/ContentHub.tsx` - Main page

Split-panel layout:
- **Left panel (60%)**: Dashboard showing recent changes, saved plans, content overview stats
- **Right panel (40%)**: AI chat interface with conversation history

**Left Panel Sections:**
- **Recent Changes** - List of all AI-made changes with "Revert" buttons
- **Saved Plans** - Plans saved for later with "Execute", "Edit", "Delete" buttons  
- **Content Overview** - Quick stats of all content types with counts

**Right Panel (AI Chat):**
- Conversation selector (dropdown of past conversations + "New" button)
- Chat messages with markdown rendering
- Paste area that accepts raw text/content
- AI responses include structured plans rendered as cards with:
  - What will change (field-by-field diff preview)
  - "Execute Plan" button
  - "Save for Later" button
  - "Edit Plan" button (opens editable version)

### 2. `src/components/admin/ContentHubChat.tsx` - Chat component

- Sends messages to `ai-content-hub` edge function
- Passes full site content summary as context on each request
- Parses AI responses for embedded plan JSON blocks
- Renders plans as interactive cards
- Supports pasting content with "Where should this go?" prompt

### 3. `src/components/admin/ContentPlanCard.tsx` - Plan display/execution

- Shows each action in the plan with before/after preview
- Color-coded: green for create, yellow for update, red for delete
- "Execute" runs all actions sequentially, saving snapshots to change_history
- "Edit" makes fields editable before execution
- Progress indicator during execution

### 4. `src/components/admin/ChangeHistoryPanel.tsx` - Change tracking

- Lists all changes grouped by plan
- Each change shows: table, field, old value, new value, timestamp
- "Revert" button per-change or per-plan (batch revert)
- "Revert All" for entire plan

### 5. `src/hooks/useContentActions.ts` - Database action executor

Core hook that:
- Executes create/update/delete operations on any content table
- Snapshots existing data before updates/deletes
- Saves all changes to `ai_change_history`
- Provides revert functionality (restores previous_data)
- Invalidates relevant React Query caches after changes

### 6. `supabase/functions/ai-content-hub/index.ts` - Enhanced AI edge function

**Key differences from existing `ai-assistant`:**
- Receives a `siteContent` parameter containing summaries of all content tables
- System prompt instructs AI to return structured plans in a specific JSON format
- Uses tool calling to return structured action plans
- Plans specify exact table, field, and value changes
- AI can suggest where pasted content should go (which table, which fields)

**Tool definition for structured output:**
```
{
  name: "content_plan",
  parameters: {
    actions: [{ 
      type: "create" | "update" | "delete",
      table: string,
      record_id: string | null,
      data: object,
      description: string
    }],
    summary: string
  }
}
```

---

## How the AI Gets Site Context

Before each message, the frontend fetches lightweight summaries:
- Count of each content type
- Last 5 items from each major table (title, id, status only)
- Current content of the item being discussed (if any)

This context is sent as part of the message body so the AI knows what exists on the site and can reference real content by ID.

---

## Route & Navigation

- Add route: `/admin/content-hub` in `App.tsx`
- Add nav item in `AdminLayout.tsx` under "Tools" group: `{ label: "AI Content Hub", href: "/admin/content-hub", icon: Sparkles }`

---

## Content Tables the AI Can Manage

The action executor supports all existing content tables:
- `articles` (create, update, delete)
- `updates` (create, update, delete)
- `projects` (create, update, delete)
- `artwork` (create, update, delete)
- `experiments` (create, update, delete)
- `favorites` (create, update, delete)
- `inspirations` (create, update, delete)
- `experiences` (create, update, delete)
- `certifications` (create, update, delete)
- `client_projects` (create, update, delete)
- `skills` (create, update, delete)

Required fields and slug generation are handled automatically by the executor.

---

## Paste Content Flow

1. User pastes text into the chat input
2. If text is long (>200 chars), UI shows: "Looks like you pasted content. Want me to suggest where to add this?"
3. AI analyzes the content and suggests:
   - Which content type it best fits (article, update, project, etc.)
   - Suggested title, category, tags
   - A structured plan to create the content
4. User can execute, edit, or save the plan

---

## Plan Editing Flow

1. AI generates a plan with specific field values
2. User clicks "Edit Plan"
3. Plan card expands to show editable fields for each action
4. User modifies values as needed
5. User clicks "Execute Edited Plan"
6. Changes are applied with the edited values

---

## Revert Flow

1. All executed changes are stored in `ai_change_history` with `previous_data`
2. Dashboard shows changes grouped by plan with timestamps
3. "Revert" on a single change: restores `previous_data` to the record
4. "Revert Plan" on a group: reverts all changes in that plan in reverse order
5. For created records: revert means delete
6. For deleted records: revert means re-insert with original data
7. Reverted changes are marked `reverted = true`

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/admin/ContentHub.tsx` | CREATE | Main AI content hub page |
| `src/components/admin/ContentHubChat.tsx` | CREATE | Chat interface with context |
| `src/components/admin/ContentPlanCard.tsx` | CREATE | Plan display and execution |
| `src/components/admin/ChangeHistoryPanel.tsx` | CREATE | Change tracking and revert UI |
| `src/hooks/useContentActions.ts` | CREATE | Database action executor with snapshots |
| `supabase/functions/ai-content-hub/index.ts` | CREATE | AI function with structured plans |
| `src/App.tsx` | MODIFY | Add /admin/content-hub route |
| `src/components/admin/AdminLayout.tsx` | MODIFY | Add nav item for Content Hub |
| Database migration | CREATE | 3 new tables with RLS |

---

## Technical Notes

- The edge function uses Lovable AI (`google/gemini-3-flash-preview`) with tool calling for structured plan output
- All database operations go through the Supabase client with proper RLS (admin-only)
- React Query cache invalidation ensures all admin dashboards reflect changes immediately
- Conversation history is persisted so you can return to previous chats
- The system never modifies content outside what's specified in the plan - each action is explicit
