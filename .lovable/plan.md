
# Multi-Feature Enhancement Plan

## Summary

This plan implements 10 distinct features to enhance the admin experience:

1. **File upload analysis for content creation** - Allow PDF/doc file uploads alongside text pasting
2. **Post media from media library to artwork** - Add bulk selection to artwork from media library
3. **GitHub link auto-fill for projects** - Already exists, verify and enhance
4. **Media library selection everywhere** - Add "Select from Library" option to all image uploaders
5. **Metaphysics writing category** - Add new category to ArticleEditor
6. **Content library selection for new content** - Allow selecting and editing existing content
7. **Experience experimentation toggle** - Mark experiences as personal experimentation vs business
8. **Email notification for site updates** - New subscriber system for update notifications
9. **Leave admin to go back to normal site** - Add navigation link to public site

---

## Phase 1: File Upload Analysis Enhancement

**Files to Modify:**
- `src/components/admin/BulkTextImporter.tsx`

**Current State:**
- Only supports `.txt` and `.md` files
- Shows "copy and paste for .docx" message
- No PDF support

**Changes:**
1. Add PDF support using the document parsing tool
2. Enhance file type detection and parsing
3. Support more document formats

**Implementation:**
```typescript
// Add to BulkTextImporter.tsx
const handleFileUpload = async (file: File) => {
  // Extended file type support
  const textTypes = ["text/plain", "text/markdown"];
  const docTypes = ["application/pdf"];
  
  if (file.type === "application/pdf") {
    // Parse PDF and extract text
    // Upload to temporary storage, call parsing function
  }
  // ... existing logic
};
```

---

## Phase 2: Post Media to Artwork from Media Library

**Files to Modify:**
- `src/pages/admin/MediaLibrary.tsx`
- `src/pages/admin/ArtworkEditor.tsx` (new mode for quick add)

**New Features:**
1. Add "Add to Artwork" button in MediaLibrary for selected items
2. Show quick modal to select category and add description
3. Support bulk selection to artwork

**Implementation:**

Add to MediaLibrary.tsx:
```typescript
// New state for artwork modal
const [addToArtworkModal, setAddToArtworkModal] = useState(false);
const [artworkCategory, setArtworkCategory] = useState("mixed");
const [artworkDetails, setArtworkDetails] = useState({ title: "", description: "" });

// Add button in bulk actions bar
<PopButton onClick={() => setAddToArtworkModal(true)} disabled={selectedItems.length === 0}>
  <Plus className="w-4 h-4 mr-2" /> Add to Artwork ({selectedItems.length})
</PopButton>

// Modal with category selector and details form
<Dialog open={addToArtworkModal}>
  {/* Category dropdown */}
  {/* Title/description fields */}
  {/* Submit to create artwork entries */}
</Dialog>
```

---

## Phase 3: Verify GitHub Link Auto-Fill

**Current State:**
- `analyze-github` edge function exists and works
- ProjectEditor already has `analyzeGitHub()` function
- GitHub URL field and analyze button already present

**Verification Complete:**
- GitHub URL field exists at ProjectEditor line 216
- `analyzeGitHub()` function at line 340-373
- AI analysis extracts: title, description, tech_stack, features, problem_statement, solution_summary

**No changes needed** - Feature is fully implemented

---

## Phase 4: Media Library Selection in All Uploaders

**Files to Modify:**
- `src/components/admin/ImageUploader.tsx`

**Current State:**
- ImageUploader has Upload and URL modes
- No "Select from Library" option

**Changes:**
1. Add third mode: "Library"
2. Show a modal/dialog with MediaLibrary picker
3. Allow selecting existing images from storage

**Implementation:**
```typescript
// Add to ImageUploader
const [showLibraryPicker, setShowLibraryPicker] = useState(false);

// Add Library button alongside Upload/URL
<button onClick={() => setMode("library")}>
  <FolderOpen className="w-3 h-3" /> Library
</button>

// Library picker component (inline or modal)
{mode === "library" && (
  <MediaLibraryPicker
    onSelect={(url) => {
      onChange(url);
      setMode("upload");
    }}
  />
)}
```

**New Component:**
- `src/components/admin/MediaLibraryPicker.tsx` - Reusable picker for selecting from library

---

## Phase 5: Add Metaphysics Writing Category

**Files to Modify:**
- `src/pages/admin/ArticleEditor.tsx`
- `src/pages/Writing.tsx`

**Current Categories:**
- philosophy, narrative, cultural, ux_review, research

**Changes:**
1. Add "metaphysics" to `WritingCategory` type
2. Add to `categoryOptions` array
3. Add color mapping in Writing.tsx

**Implementation:**
```typescript
// ArticleEditor.tsx
type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research" | "metaphysics";

const categoryOptions = [
  // ... existing
  { value: "metaphysics", label: "Metaphysics" },
];

// Writing.tsx
const categoryColors = {
  // ... existing
  metaphysics: "bg-purple-600",
};
```

---

## Phase 6: Content Library Selection for New Content

**Files to Modify:**
- `src/pages/admin/ContentLibrary.tsx`
- Various editors (ArticleEditor, UpdateEditor, ProjectEditor)

**Current State:**
- ContentLibrary lists existing content
- "Edit" link goes to the editor with the item loaded
- No "New from Existing" flow

**Changes:**
1. Add "Duplicate" option in ContentLibrary dropdown
2. When creating new content, add option to "Start from Existing"
3. Use existing `?clone=` parameter pattern

**Implementation:**
```typescript
// ContentLibrary.tsx - Add duplicate option
<DropdownMenuItem asChild>
  <Link to={`${getEditUrl(item).replace('/edit', '/new')}?clone=${item.id}`}>
    <Copy className="w-4 h-4 mr-2" /> Duplicate
  </Link>
</DropdownMenuItem>
```

---

## Phase 7: Experience Experimentation Toggle

**Files to Modify:**
- `src/pages/admin/ExperienceEditor.tsx`
- Database migration for `is_experimentation` column

**Current State:**
- Experiences are assumed to be business activities
- No flag for personal experimentation/learning

**Changes:**
1. Add `is_experimentation` boolean field
2. Add toggle in editor: "This was experimentation/learning (not a business)"
3. Add description field for "What I was figuring out"

**Implementation:**
```typescript
// ExperienceEditor form state
const [form, setForm] = useState({
  // ... existing
  is_experimentation: false,
  experimentation_goal: "",
});

// UI toggle
<div className="flex items-center gap-2">
  <Switch
    id="is_experimentation"
    checked={form.is_experimentation}
    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_experimentation: checked }))}
  />
  <Label htmlFor="is_experimentation">
    This was personal experimentation (not a business venture)
  </Label>
</div>

{form.is_experimentation && (
  <div>
    <Label>What I was trying to figure out</Label>
    <Textarea
      value={form.experimentation_goal}
      onChange={(e) => setForm(prev => ({ ...prev, experimentation_goal: e.target.value }))}
      placeholder="e.g., Learning how to make pottery, Testing a new technique..."
    />
  </div>
)}
```

---

## Phase 8: Email Notification for Site Updates

**New Files:**
- `src/components/newsletter/SubscribeForm.tsx`
- `supabase/functions/send-update-notification/index.ts`

**Database Changes:**
- New `email_subscribers` table

**Implementation:**

1. Create subscribers table:
```sql
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website'
);

-- RLS policies
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON email_subscribers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

2. Create subscribe form component:
```typescript
// SubscribeForm.tsx
const SubscribeForm = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Insert into email_subscribers
    // Show success toast
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit">Subscribe</Button>
    </form>
  );
};
```

3. Add subscribe form to Footer or Updates page

---

## Phase 9: Leave Admin to Go Back to Site

**Files to Modify:**
- `src/components/admin/AdminLayout.tsx`

**Current State:**
- Sidebar has Dashboard, Content, Tools, Account sections
- Sign Out button at bottom
- No link to public site

**Changes:**
1. Add "View Site" link in sidebar
2. Add icon and styling

**Implementation:**
```typescript
// Add to AdminLayout.tsx sidebar, above Sign Out button
<Link
  to="/"
  target="_blank"
  className="flex items-center gap-3 px-3 py-2 w-full rounded hover:bg-background/10 transition-colors"
  title={collapsed ? "View Site" : undefined}
>
  <ExternalLink className="w-5 h-5 flex-shrink-0" />
  {!collapsed && <span>View Site</span>}
</Link>
```

---

## Database Migrations Required

### Migration 1: Experience experimentation fields
```sql
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS is_experimentation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS experimentation_goal TEXT;
```

### Migration 2: Email subscribers table
```sql
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website'
);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON email_subscribers 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage subscribers" ON email_subscribers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/BulkTextImporter.tsx` | MODIFY | Add PDF/doc file analysis support |
| `src/pages/admin/MediaLibrary.tsx` | MODIFY | Add "Add to Artwork" bulk action with category selection |
| `src/components/admin/ImageUploader.tsx` | MODIFY | Add "Library" mode for selecting from media library |
| `src/components/admin/MediaLibraryPicker.tsx` | CREATE | Reusable media library picker component |
| `src/pages/admin/ArticleEditor.tsx` | MODIFY | Add "metaphysics" category |
| `src/pages/Writing.tsx` | MODIFY | Add metaphysics category display |
| `src/pages/admin/ContentLibrary.tsx` | MODIFY | Add duplicate/clone option |
| `src/pages/admin/ExperienceEditor.tsx` | MODIFY | Add experimentation toggle and fields |
| `src/components/newsletter/SubscribeForm.tsx` | CREATE | Email subscription form component |
| `src/components/layout/Footer.tsx` | MODIFY | Add subscribe form |
| `src/components/admin/AdminLayout.tsx` | MODIFY | Add "View Site" link |

---

## Technical Notes

### File Upload Enhancement
- Use the browser's FileReader API for text extraction
- PDF parsing would need a client-side library or backend processing
- Consider using edge function for complex document parsing

### Media Library Picker
- Create a reusable component that can be embedded inline or shown in a dialog
- Support single and multi-select modes
- Show thumbnails with in-use indicators

### Email Notifications
- Start with basic subscription storage
- Email sending can be added later via an edge function
- Consider using a service like Resend or SendGrid for production

### GitHub Analysis
- Already fully implemented and working
- Uses Lovable AI to analyze README content
- Extracts tech stack from package.json
