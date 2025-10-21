# Digital Locker - Backend Setup Instructions

## What We've Created

### 1. **Supabase Setup Guide** (`SUPABASE_DIGITAL_LOCKER_SETUP.md`)
Complete SQL scripts to set up:
- `locker_documents` table with all necessary columns
- RLS (Row Level Security) policies
- Storage bucket configuration
- Indexes for performance
- Helper functions for timestamps

### 2. **Helper Functions** (`js/locker-helpers.js`)
JavaScript module with:
- Document type constants and icons
- File validation and formatting functions
- All Supabase CRUD operations
- Search and filter functions
- Notification system

---

## Setup Checklist

### Phase 1: Supabase Database Setup (DO THIS FIRST)

- [ ] **Step 1**: Go to your Supabase Dashboard
- [ ] **Step 2**: Open SQL Editor
- [ ] **Step 3**: Copy and run the SQL from `SUPABASE_DIGITAL_LOCKER_SETUP.md`
  - Create `locker_documents` table
  - Create indexes
  - Enable RLS
  - Create RLS policies
  - Create timestamp update function

- [ ] **Step 4**: Verify storage bucket
  - Go to Storage section
  - Check if `user-documents` bucket exists
  - If not, create it (Private visibility)

- [ ] **Step 5**: Set up storage RLS policies
  - Go to Storage → Policies
  - Add the three policies from the setup guide

- [ ] **Step 6**: Test the setup
  - Run the test queries in the setup guide
  - Verify you can insert/select/update documents

### Phase 2: Verify Files Are Created

- [ ] `js/locker-helpers.js` exists and is ready
- [ ] `SUPABASE_DIGITAL_LOCKER_SETUP.md` has all SQL scripts

---

## Database Schema

### locker_documents Table

```
id                  → UUID (auto-generated)
user_id             → UUID (links to auth.users)
document_name       → TEXT (editable by user)
document_type       → TEXT (national_id, passport, etc.)
file_path           → TEXT (path in storage)
file_size           → INTEGER (bytes)
mime_type           → TEXT (application/pdf, image/jpeg, etc.)
storage_url         → TEXT (public URL for viewing/downloading)
description         → TEXT (optional notes)
tags                → TEXT[] (array of tags)
is_archived         → BOOLEAN (soft delete)
uploaded_at         → TIMESTAMP (auto-set)
updated_at          → TIMESTAMP (auto-updated)
```

---

## Storage Bucket Configuration

### Bucket: `user-documents`

**Path Structure**: `{user_id}/documents/{document_id}.{extension}`

**Example**: 
```
550e8400-e29b-41d4-a716-446655440000/documents/abc123.pdf
```

**RLS Policies**:
- Users can upload to their own folder
- Users can view their own documents
- Users can delete their own documents

---

## Available Functions in locker-helpers.js

### Upload & Storage
```javascript
uploadDocumentToStorage(file, userId, documentId)
deleteDocumentFromStorage(filePath)
```

### Document CRUD
```javascript
createLockerDocument(userId, documentData)
getUserLockerDocuments(userId, archived)
getDocument(documentId)
updateDocumentName(documentId, newName)
updateDocumentDescription(documentId, description)
deleteLockerDocument(documentId, filePath)
```

### Search & Filter
```javascript
searchLockerDocuments(userId, searchTerm)
getDocumentsByType(userId, documentType)
getDocumentCount(userId)
```

### Utilities
```javascript
getDocIcon(docType)
formatFileSize(bytes)
formatDate(dateString)
validateFile(file, maxSize)
showNotification(message, type)
debounce(func, wait)
```

---

## Important Notes

1. **File Size Limit**: 50MB per file (configurable in frontend)
2. **Allowed File Types**: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX
3. **Document Types**: Only specific types allowed (see DOCUMENT_TYPES constant)
4. **RLS Security**: Users can only access their own documents
5. **Soft Delete**: Use `is_archived` instead of hard delete
6. **Timestamps**: Auto-managed by Supabase

---

## What's Next

After completing the Supabase setup:

1. **Create `js/digital-locker-main.js`**
   - Main application logic
   - Document rendering
   - Upload handling
   - View/download operations
   - Edit document name functionality

2. **Update `dashboard.html`**
   - Connect upload modal
   - Add event listeners

3. **Update `digital-locker.html`**
   - Add search, filter, sort
   - Document grid display
   - View modal
   - Edit name modal

4. **Update `js/dashboard.js`**
   - Add upload modal handlers
   - Connect to Supabase

---

## Testing Queries

Once setup is complete, test with these SQL queries:

### Insert Test Document
```sql
INSERT INTO locker_documents (
  user_id, document_name, document_type, file_path,
  file_size, mime_type, storage_url, description
) VALUES (
  auth.uid(),
  'Test Document',
  'national_id',
  'test-path/test.pdf',
  1024,
  'application/pdf',
  'https://example.com/test.pdf',
  'Test description'
);
```

### Query Your Documents
```sql
SELECT * FROM locker_documents WHERE user_id = auth.uid();
```

### Update Document Name
```sql
UPDATE locker_documents
SET document_name = 'Updated Name'
WHERE id = 'document-id' AND user_id = auth.uid();
```

---

## Troubleshooting

### Issue: "Permission denied" error
**Solution**: 
- Verify RLS policies are created
- Check user is authenticated
- Ensure storage bucket is named exactly `user-documents`

### Issue: Can't see uploaded documents
**Solution**:
- Check `user_id` matches `auth.uid()`
- Verify RLS policies are enabled
- Check browser console for errors

### Issue: File upload fails
**Solution**:
- Check file size (max 50MB)
- Verify file type is allowed
- Check storage bucket exists and is private

---

## File Structure After Setup

```
js/
├── supabase.js                    (existing)
├── locker-helpers.js              (✓ CREATED)
├── digital-locker-main.js         (next step)
└── dashboard.js                   (to update)

html/
├── dashboard.html                 (to update)
└── digital-locker.html            (to update)

docs/
├── SUPABASE_DIGITAL_LOCKER_SETUP.md    (✓ CREATED)
└── DIGITAL_LOCKER_BACKEND_SETUP.md     (this file)
```

---

## Ready to Proceed?

Once you've completed the Supabase setup:
1. Confirm all tables and policies are created
2. Run the test queries to verify
3. Let me know when ready for frontend implementation

