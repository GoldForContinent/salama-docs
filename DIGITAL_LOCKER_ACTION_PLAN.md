# Digital Locker Implementation - Action Plan

## Overview
Build a complete digital locker system where users can:
- Upload documents from the dashboard modal
- View all documents in the digital locker page
- Organize documents into folders
- Download and view documents
- Keep soft copies safe instead of carrying physical documents

---

## Current State Analysis

### What Exists:
1. **Dashboard** (`dashboard.html`):
   - Has a "Digital Locker" section with "Upload Document" button
   - Has an upload modal (`uploadModal`) with basic fields
   - Button to view all documents

2. **Digital Locker Page** (`digital-locker.html`):
   - Simple page with empty state
   - Currently loads `js/digital-locker.js` (basic version)

3. **Multiple JS Files** (causing confusion):
   - `digital-locker.js` - Simple version (localStorage only)
   - `digital-locker-enhanced.js` - Advanced version (Supabase)
   - `locker-upload-modal.js` - Upload modal logic
   - `locker-utils.js` - Helper functions

### Problem:
- Multiple files not consolidated
- Dashboard modal not connected to digital locker page
- Changes not reflecting because files aren't being used properly

---

## Solution Architecture

### Storage Bucket
**Use: `user-documents`** (separate from `document-photos` used for reports)

### Database Tables Needed (Supabase)
1. **locker_documents**
   - id (UUID)
   - user_id (UUID)
   - document_name (text)
   - document_type (text)
   - folder_id (UUID, nullable)
   - file_path (text)
   - file_size (integer)
   - mime_type (text)
   - storage_url (text)
   - description (text, nullable)
   - tags (array, nullable)
   - is_archived (boolean)
   - uploaded_at (timestamp)

2. **locker_folders**
   - id (UUID)
   - user_id (UUID)
   - folder_name (text)
   - description (text, nullable)
   - color (text)
   - created_at (timestamp)

---

## Implementation Steps

### Step 1: Create Consolidated Digital Locker JS File
**File:** `js/digital-locker-main.js`

This single file will contain:
- Initialization and authentication
- Document upload handling
- Document rendering (grid/list view)
- Folder management
- Search, filter, sort functionality
- Download and view operations
- All helper functions

### Step 2: Update Dashboard HTML
**File:** `dashboard.html`

- Keep the upload modal as is
- Connect it to the new consolidated JS
- Add event listeners to trigger upload modal

### Step 3: Update Digital Locker HTML
**File:** `digital-locker.html`

- Add sections for:
  - Statistics (total documents, storage used, folders)
  - Search and filter bar
  - View mode toggle (grid/list)
  - Documents container
  - Folders section
  - Upload form (duplicate of dashboard modal for convenience)

### Step 4: Update Dashboard JS
**File:** `js/dashboard.js`

- Add `openUploadModal()` function
- Connect upload form submission to Supabase
- Refresh digital locker data after upload

### Step 5: Create Utility Functions
**File:** `js/locker-helpers.js`

- Document type icons and names
- File size formatting
- File validation
- Supabase operations (CRUD for documents and folders)

---

## Key Features to Implement

### 1. Upload Modal (Dashboard)
```
- Document Type dropdown
- File upload (drag & drop + click)
- Folder selection (optional)
- Description (optional)
- Tags (optional)
- Progress bar
- Error handling
```

### 2. Digital Locker Page
```
- Header with user info (session-based, no need for photo)
- Statistics cards (total docs, storage used, folders)
- Search bar
- Filter by document type
- Sort options (date, name, size)
- View toggle (grid/list)
- Document cards with:
  - Icon based on type
  - Document name
  - Upload date
  - File size
  - Folder (if any)
  - Tags
  - Action buttons (view, download, move, delete)
- Folders section
- Empty state message
```

### 3. Folder Management
```
- Create folder with name, description, color
- Move documents to folders
- View documents in folder
- Delete folder
```

### 4. Document Operations
```
- View (preview modal for images/PDFs)
- Download
- Move to folder
- Archive
- Delete
- Add tags
- Add description
```

---

## Supabase Configuration

### Storage Bucket
```
Bucket Name: user-documents
Visibility: Private
Path Structure: {user_id}/documents/{document_id}.{ext}
```

### RLS Policies
```
SELECT: Users can only access their own documents
INSERT: Users can only insert their own documents
UPDATE: Users can only update their own documents
DELETE: Users can only delete their own documents
```

---

## File Structure After Implementation

```
js/
├── digital-locker-main.js      (NEW - consolidated main file)
├── locker-helpers.js            (NEW - utility functions)
├── dashboard.js                 (UPDATE - add upload handlers)
└── [old files to delete]
    ├── digital-locker.js
    ├── digital-locker-enhanced.js
    ├── locker-upload-modal.js
    └── locker-utils.js

html/
├── dashboard.html               (UPDATE - connect upload modal)
└── digital-locker.html          (UPDATE - add all sections)

css/
└── digital-locker.css           (UPDATE if needed)
```

---

## Next Steps

1. **Confirm database tables exist** in Supabase
2. **Create `digital-locker-main.js`** with all consolidated code
3. **Create `locker-helpers.js`** with utility functions
4. **Update `dashboard.html`** to use new JS
5. **Update `digital-locker.html`** with complete UI
6. **Update `dashboard.js`** with upload handlers
7. **Test upload flow** from dashboard to digital locker
8. **Test all CRUD operations** (create, read, update, delete)
9. **Delete old locker JS files** to clean up

---

## Questions to Confirm

1. Do you have the `locker_documents` and `locker_folders` tables in Supabase?
2. Is the `user-documents` storage bucket created?
3. Are RLS policies set up for these tables?
4. Do you want the digital locker page to show user info at the top (name, email)?
5. Should users be able to share documents with others (future feature)?

