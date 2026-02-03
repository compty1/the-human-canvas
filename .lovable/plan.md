
# Comprehensive Enhancement Plan

## Overview

This plan addresses multiple feature requests to enhance the portfolio platform:

1. **Multiple images for inspirations** with admin multi-upload support
2. **Auto-generate/regenerate AI buttons** across all content editors
3. **Undo/Redo functionality** for content editing
4. **New project statuses**: "Finishing Stages" and "Final Review"
5. **Drag-to-reorder** inspirations with automatic order swapping

---

## 1. Multiple Images for Inspirations

### Database Migration

Add `images` array column to the `inspirations` table:

```sql
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

The existing `image_url` column will remain for backward compatibility (used as primary/cover image), while `images` stores additional images.

### Admin Editor Changes

**File: `src/pages/admin/InspirationEditor.tsx`**

- Add `MultiImageUploader` component alongside the existing single ImageUploader
- Update form state to include `images: []`
- Save both `image_url` (cover) and `images` (gallery) to database

### Public Page Changes

**File: `src/pages/InspirationDetail.tsx`**

- Display image gallery when multiple images exist
- Create a scrollable gallery or grid layout

---

## 2. AI Auto-Generate/Regenerate Buttons

### New Component: `AIGenerateButton.tsx`

**File: `src/components/admin/AIGenerateButton.tsx`**

A reusable component that:
- Shows "Generate" for empty fields, "Regenerate" if content exists
- Calls the AI assistant edge function with field-specific prompts
- Displays loading state during generation
- Returns generated content via callback

```text
+-------------------------------------------+
| [Sparkles icon] Generate Description      |
+-------------------------------------------+
```

### Integration Points

Add the AIGenerateButton to these content editors:

| Editor | Fields to Auto-Generate |
|--------|------------------------|
| `InspirationEditor.tsx` | description, detailed_content |
| `ArticleEditor.tsx` | excerpt, content |
| `ProjectEditor.tsx` | description, long_description, problem_statement, solution_summary |
| `ExperienceEditor.tsx` | description, long_description |
| `CertificationEditor.tsx` | description |
| `FavoriteEditor.tsx` | description, impact_statement |
| `UpdateEditor.tsx` | content |

### Edge Function Enhancement

**File: `supabase/functions/ai-assistant/index.ts`**

Add a `generateField` action type that accepts:
- `fieldName`: which field to generate
- `context`: existing form data for context
- `contentType`: type of content being edited

Returns field-specific generated text.

---

## 3. Undo/Redo Functionality

### Approach: Form History Stack

Create a custom hook that tracks form state changes:

**File: `src/hooks/useFormHistory.ts`**

```typescript
export const useFormHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  const undo = () => { ... };
  const redo = () => { ... };
  const pushState = (newState: T) => { ... };
  
  return { current, canUndo, canRedo, undo, redo, pushState };
};
```

### UI Component: `UndoRedoControls.tsx`

**File: `src/components/admin/UndoRedoControls.tsx`**

A simple toolbar component:

```text
+--------+--------+
| [Undo] | [Redo] |
+--------+--------+
```

- Disabled states when at beginning/end of history
- Keyboard shortcuts: Ctrl+Z for undo, Ctrl+Shift+Z for redo

### Integration

Add `UndoRedoControls` to editor headers in:
- InspirationEditor
- ArticleEditor
- ProjectEditor
- ExperienceEditor
- CertificationEditor
- FavoriteEditor
- UpdateEditor

---

## 4. New Project Statuses

### Database Migration

The `projects.status` column currently uses a text type with values: `planned`, `in_progress`, `live`.

Add new status values:

```sql
-- No migration needed - the column is TEXT type, not an enum
-- Simply update the UI to include new options
```

### UI Updates

**File: `src/pages/admin/ProjectEditor.tsx`**

Update the status dropdown options:

```typescript
const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "finishing_stages", label: "Finishing Stages" },
  { value: "final_review", label: "Final Review" },
  { value: "live", label: "Live" },
];
```

**File: `src/pages/Projects.tsx`** and related files

Update status display colors:

| Status | Color |
|--------|-------|
| planned | Gray/Muted |
| in_progress | Yellow |
| finishing_stages | Orange |
| final_review | Purple |
| live | Green |

---

## 5. Drag-to-Reorder Inspirations with Auto-Swap

### Library

Use native HTML5 drag-and-drop (no additional dependencies needed).

### Admin Manager Changes

**File: `src/pages/admin/InspirationsManager.tsx`**

Add drag-and-drop functionality:

1. Make each inspiration row draggable
2. Show visual indicators during drag (drop zones)
3. On drop: swap `order_index` values between dragged item and target
4. Persist to database immediately

```text
+--------------------------------------------------+
| [:::] #1 | Inspiration A          | [Edit] [Del] |
+--------------------------------------------------+
| [:::] #2 | Inspiration B (dragging)| [Edit] [Del] |
+--------------------------------------------------+
| [:::] #3 | Inspiration C           | [Edit] [Del] |
+--------------------------------------------------+
       ^
       |-- Drop zone indicator
```

### Swap Logic

When dragging item A to position of item B:
- Item A gets B's `order_index`
- Item B gets A's `order_index`
- Both are updated in a single database transaction

```typescript
const handleDrop = async (draggedId: string, targetId: string) => {
  const draggedItem = inspirations.find(i => i.id === draggedId);
  const targetItem = inspirations.find(i => i.id === targetId);
  
  // Swap order indices
  await supabase.from("inspirations").update({ order_index: targetItem.order_index }).eq("id", draggedId);
  await supabase.from("inspirations").update({ order_index: draggedItem.order_index }).eq("id", targetId);
  
  // Refetch to update UI
  queryClient.invalidateQueries(["admin-inspirations"]);
};
```

### Editor Order Field Enhancement

**File: `src/pages/admin/InspirationEditor.tsx`**

When changing `order_index` manually:
- Show current item in that position (if any)
- Prompt: "This will swap with [Item Name]. Continue?"
- Auto-swap on confirmation

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/admin/AIGenerateButton.tsx` | Reusable AI content generation button |
| `src/components/admin/UndoRedoControls.tsx` | Undo/redo toolbar component |
| `src/hooks/useFormHistory.ts` | Form state history management hook |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/InspirationEditor.tsx` | Add multi-image upload, AI buttons, undo/redo |
| `src/pages/admin/InspirationsManager.tsx` | Add drag-and-drop reordering |
| `src/pages/admin/ProjectEditor.tsx` | Add new status options, AI buttons, undo/redo |
| `src/pages/admin/ArticleEditor.tsx` | Add AI buttons, undo/redo |
| `src/pages/admin/ExperienceEditor.tsx` | Add AI buttons, undo/redo |
| `src/pages/admin/CertificationEditor.tsx` | Add AI buttons, undo/redo |
| `src/pages/admin/FavoriteEditor.tsx` | Add AI buttons, undo/redo |
| `src/pages/admin/UpdateEditor.tsx` | Add AI buttons, undo/redo |
| `src/pages/InspirationDetail.tsx` | Display multiple images gallery |
| `src/pages/Projects.tsx` | Display new status colors |
| `supabase/functions/ai-assistant/index.ts` | Add field generation endpoint |

### Database Migration

```sql
-- Add images array to inspirations
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

---

## Technical Details

### Drag-and-Drop Implementation

Using native HTML5 APIs:

```typescript
<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => handleDrop(e.dataTransfer.getData("text/plain"), item.id)}
>
  {/* Inspiration content */}
</div>
```

### AI Generation Prompt Templates

For each field type, use specific prompts:

```typescript
const prompts = {
  description: `Write a compelling 1-2 sentence description for this ${contentType}...`,
  long_description: `Write a detailed 2-3 paragraph description...`,
  excerpt: `Write a brief teaser excerpt (under 160 characters)...`,
  impact_statement: `Write a personal impact statement explaining how this influenced you...`,
};
```

### Undo/Redo Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey && canRedo) redo();
      else if (canUndo) undo();
      e.preventDefault();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canUndo, canRedo]);
```

---

## Implementation Order

1. Database migration (add `images` column)
2. Create `useFormHistory` hook
3. Create `UndoRedoControls` component
4. Create `AIGenerateButton` component
5. Update edge function for field generation
6. Update `InspirationEditor` with all features
7. Update `InspirationsManager` with drag-and-drop
8. Update `ProjectEditor` with new statuses
9. Update remaining editors with AI + undo/redo
10. Update public pages for new data display
