

# Fix Bulk Import Issues & Add Bulk Artwork Image Upload

## Overview

This plan addresses three critical issues with the bulk import system:
1. Single file selection only (no multi-select capability)
2. Incorrect item count (showing 2223 items when selecting one file)
3. Missing bulk image upload feature for artwork (mentioned in system memory but not implemented)

---

## Problems Identified

### Issue 1: No Multi-File Selection
The current `BulkImport.tsx` file input lacks the `multiple` attribute, preventing users from selecting multiple files at once.

### Issue 2: Incorrect Row Count (2223 Items)
The CSV parser is treating content incorrectly. When a file is selected, the parser may be:
- Splitting on individual characters instead of proper CSV delimiters
- Not handling Excel-exported CSV files with different encodings or line endings
- Mishandling files without proper CSV structure

This happens because the parser does a naive `split("\n")` which can fail with:
- Windows line endings (`\r\n`)
- Single-line files with many commas
- Binary file detection issues (XLSX files being read as text)

### Issue 3: Missing Bulk Image Upload for Artwork
The memory indicates this feature should exist, but currently the only bulk import is for CSV/JSON data, not for actual image files.

---

## Solution

### 1. Fix CSV Parser in BulkImport.tsx

**Changes:**
- Add robust line ending handling (support `\r\n`, `\r`, and `\n`)
- Add better XLSX file detection (reject or parse properly)
- Add validation before showing parsed data count
- Clear input file value to allow re-selecting the same file

```
// Before (line 65)
const lines = text.split("\n").filter(line => line.trim());

// After - Handle all line endings
const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
```

### 2. Add Multi-File Selection Support

Add the `multiple` attribute to allow batch file selection for bulk data import:

```
<input
  type="file"
  accept=".csv,.json"
  multiple  // ADD THIS
  onChange={handleFileChange}
/>
```

Modify `handleFileChange` to process multiple files and merge their data.

### 3. Create Bulk Artwork Image Uploader

Add a new section to the Artwork Manager or a new dedicated page that allows:
- Selecting multiple images at once
- Automatically creating artwork database records from filenames
- Uploading all images to storage in parallel
- Showing upload progress

**New Component: `BulkArtworkUploader.tsx`**

```text
+-----------------------------------------------------------------+
| Bulk Artwork Upload                                              |
+-----------------------------------------------------------------+
| [Drop images here or click to select]                           |
|                                                                  |
| Category: [Dropdown: portrait | landscape | photography | ...]  |
|                                                                  |
| Preview:                                                         |
| +-------+  +-------+  +-------+  +-------+                      |
| | img1  |  | img2  |  | img3  |  | img4  |                      |
| | title |  | title |  | title |  | title |                      |
| +-------+  +-------+  +-------+  +-------+                      |
|                                                                  |
| [Upload 4 Images]                                                |
+-----------------------------------------------------------------+
```

---

## Technical Implementation

### File Changes

| File | Changes |
|------|---------|
| `src/pages/admin/BulkImport.tsx` | Fix CSV parser, add multi-file support, add file type validation |
| `src/components/admin/BulkArtworkUploader.tsx` | New component for bulk image uploads |
| `src/pages/admin/ArtworkManager.tsx` | Add bulk upload button/section |

### 1. BulkImport.tsx Fixes

**Fix 1: Robust Line Parsing**
```typescript
// Replace line 65
const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
```

**Fix 2: Better File Type Validation**
```typescript
// After line 49, before reading file
if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
  setErrors(["Excel files (.xlsx/.xls) are not supported. Please export as CSV first."]);
  return;
}
```

**Fix 3: CSV Field Count Validation**
```typescript
// After parsing, validate the data makes sense
if (data.length > 1000) {
  setErrors(["Too many rows detected. Please check the file format."]);
  return;
}

// Validate that rows have reasonable field counts
const expectedFieldCount = headers.length;
const validData = data.filter(row => 
  Object.keys(row).length === expectedFieldCount
);
```

**Fix 4: Multi-File Support**
```typescript
// Change file input
<input
  type="file"
  accept=".csv,.json"
  multiple
  onChange={handleFilesChange}
/>

// Process multiple files, merging their parsed data
const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  // Merge data from all files
  const allData: ImportRow[] = [];
  for (const file of Array.from(files)) {
    // Parse each file and combine
  }
};
```

### 2. BulkArtworkUploader.tsx (New Component)

Features:
- Multi-image drag & drop zone
- File preview grid with titles derived from filenames
- Category selector (portrait, landscape, photography, etc.)
- Parallel upload with progress indicator
- Auto-creates artwork database records

**Database workflow:**
1. User selects multiple images
2. Component shows previews with editable titles (defaults to filename without extension)
3. User selects category
4. On "Upload All":
   - Upload each image to Supabase storage
   - Create artwork record with title, image_url, and category
   - Show progress bar
   - Report success/failure count

### 3. ArtworkManager.tsx Updates

Add a "Bulk Upload" button next to "Add Artwork":

```typescript
<div className="flex gap-3">
  <Link to="/admin/artwork/new">
    <PopButton>
      <Plus className="w-4 h-4 mr-2" /> Add Artwork
    </PopButton>
  </Link>
  <PopButton variant="secondary" onClick={() => setShowBulkUpload(true)}>
    <Upload className="w-4 h-4 mr-2" /> Bulk Upload
  </PopButton>
</div>

{showBulkUpload && (
  <BulkArtworkUploader 
    onComplete={() => {
      setShowBulkUpload(false);
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
    }}
    onCancel={() => setShowBulkUpload(false)}
  />
)}
```

---

## Summary

| Issue | Solution |
|-------|----------|
| Can't select multiple files | Add `multiple` attribute to file input |
| Shows 2223 items | Fix CSV parser to handle line endings properly and validate data |
| No bulk image upload | Create new BulkArtworkUploader component |

These changes will:
1. Fix the broken CSV parsing that shows incorrect item counts
2. Enable multi-file selection for data imports
3. Add dedicated bulk image upload for artwork with automatic database record creation

