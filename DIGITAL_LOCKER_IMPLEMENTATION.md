# Digital Locker Implementation Plan

## Overview
Complete digital locker system allowing users to store, organize, retrieve, and download soft copies of important documents.

---

## Architecture

### **Supabase Storage Bucket**
```
Bucket Name: user-documents
├── {user_id}/
│   ├── documents/
│   │   ├── {document_id}.pdf
│   │   ├── {document_id}.jpg
│   │   └── ...
│   └── thumbnails/
│       └── {document_id}_thumb.jpg
```

**Important**: This is SEPARATE from `document-photos` bucket used for report documents.

### **Database Tables**

#### **1. locker_documents**
```sql
CREATE TABLE locker_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  folder_id UUID REFERENCES locker_folders(id),
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  storage_url TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  UNIQUE(user_id, file_path)
);

CREATE INDEX idx_locker_user ON locker_documents(user_id);
CREATE INDEX idx_locker_folder ON locker_documents(folder_id);
CREATE INDEX idx_locker_archived ON locker_documents(is_archived);
```

#### **2. locker_folders**
```sql
CREATE TABLE locker_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  folder_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#006600',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, folder_name)
);

CREATE INDEX idx_folder_user ON locker_folders(user_id);
```

---

## Features

### **1. Upload Modal (Dashboard)**
- Accessible from dashboard "Upload Document" button
- Modal form with:
  - Document type selector
  - File input (drag & drop support)
  - Folder selector
  - Document description
  - Tags input
  - Upload progress bar
  - File size validation (max 50MB)

### **2. Digital Locker Page**
- Display all user documents
- Grid/list view toggle
- Filter by:
  - Document type
  - Folder
  - Date range
  - Tags
- Sort by:
  - Date (newest/oldest)
  - Name (A-Z)
  - Size
- Search functionality
- Bulk actions (select multiple, delete, move, download)

### **3. Folder Management**
- Create/edit/delete folders
- Folder colors for organization
- Drag & drop documents between folders
- Folder statistics (document count, total size)

### **4. Document Actions**
- **View**: Open in modal with preview
- **Download**: Direct download to device
- **Move**: Move to different folder
- **Share**: Generate share link (optional)
- **Archive**: Archive old documents
- **Delete**: Permanent deletion
- **Edit**: Update metadata

### **5. Document Preview**
- Images: Display in modal
- PDFs: Embed viewer
- Other files: Download option
- Full-screen view
- Zoom controls

---

## Implementation Steps

### **Step 1: Database Setup**
```sql
-- Create tables
-- Create indexes
-- Set up RLS policies
```

### **Step 2: Supabase Configuration**
```
Storage Bucket: user-documents
- Public: No
- Allowed MIME types: image/*, application/pdf
- Max file size: 52428800 (50MB)
```

### **Step 3: Dashboard Integration**
- Add upload modal to dashboard
- Connect to digital locker page
- Show upload progress

### **Step 4: Digital Locker Page**
- Display documents from database
- Implement folder system
- Add search/filter
- Add bulk actions

### **Step 5: Document Management**
- Upload handler
- Download handler
- Delete handler
- Move handler
- Archive handler

### **Step 6: UI/UX**
- Responsive design
- Mobile optimization
- Loading states
- Error handling
- Success notifications

---

## API Endpoints (Supabase RPC Functions)

### **1. Upload Document**
```javascript
// Function: upload_locker_document
// Params: user_id, document_name, document_type, folder_id, description, tags
// Returns: document_id, storage_url
```

### **2. Get User Documents**
```javascript
// Function: get_user_locker_documents
// Params: user_id, folder_id (optional), archived (optional)
// Returns: array of documents with metadata
```

### **3. Create Folder**
```javascript
// Function: create_locker_folder
// Params: user_id, folder_name, description, color
// Returns: folder_id
```

### **4. Move Document**
```javascript
// Function: move_locker_document
// Params: document_id, new_folder_id
// Returns: success status
```

### **5. Delete Document**
```javascript
// Function: delete_locker_document
// Params: document_id
// Returns: success status
```

---

## File Structure

```
js/
├── digital-locker.js          (Main page logic)
├── locker-upload.js           (Upload modal logic)
└── locker-utils.js            (Helper functions)

css/
├── digital-locker.css         (Main page styles)
└── locker-modal.css           (Modal styles)

html/
└── digital-locker.html        (Main page)
```

---

## Security Considerations

### **1. Authentication**
- Only authenticated users can access
- User ID verified on backend

### **2. Authorization**
- Users can only access their own documents
- RLS policies enforce this

### **3. File Validation**
- File type validation (client + server)
- File size limits (50MB max)
- Virus scanning (optional)

### **4. Storage**
- Files stored in user-specific folders
- Private bucket (not publicly accessible)
- Signed URLs for downloads

### **5. Data Privacy**
- No document sharing by default
- Encryption at rest (Supabase default)
- Encryption in transit (HTTPS)

---

## Storage Bucket Configuration

### **Bucket Name**: `user-documents`

### **Settings**
```
Public: No
Allowed MIME types:
  - image/jpeg
  - image/png
  - image/gif
  - image/webp
  - application/pdf
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document

Max file size: 52428800 bytes (50MB)
```

### **RLS Policies**
```sql
-- SELECT: Users can only view their own documents
-- INSERT: Users can only insert their own documents
-- UPDATE: Users can only update their own documents
-- DELETE: Users can only delete their own documents
```

---

## Document Types Supported

```javascript
const DOCUMENT_TYPES = {
  'national_id': 'National ID Card',
  'passport': 'Kenyan Passport',
  'driving_license': 'Driving License',
  'kra_pin': 'KRA PIN Certificate',
  'birth_certificate': 'Birth Certificate',
  'marriage_certificate': 'Marriage Certificate',
  'death_certificate': 'Death Certificate',
  'school_certificate': 'School Certificate',
  'university_degree': 'University Degree',
  'college_diploma': 'College Diploma',
  'work_permit': 'Work Permit',
  'business_permit': 'Business Permit',
  'title_deed': 'Title Deed',
  'lease_agreement': 'Lease Agreement',
  'insurance_policy': 'Insurance Policy',
  'medical_report': 'Medical Report',
  'bank_statement': 'Bank Statement',
  'loan_agreement': 'Loan Agreement',
  'power_attorney': 'Power of Attorney',
  'will': 'Will/Testament',
  'other': 'Other Document'
};
```

---

## User Flow

### **Upload Document**
1. User clicks "Upload Document" on dashboard
2. Modal opens with upload form
3. User selects document type
4. User chooses file (drag & drop or click)
5. User optionally selects folder
6. User adds description and tags
7. User clicks "Upload"
8. File uploads to Supabase Storage
9. Metadata saved to database
10. Success notification shown
11. Document appears in digital locker

### **View Documents**
1. User navigates to Digital Locker page
2. All documents load from database
3. Documents displayed in grid view
4. User can filter/search/sort
5. User clicks document to preview
6. Preview modal opens

### **Organize Documents**
1. User creates folders
2. User moves documents to folders
3. User can view by folder
4. User can archive old documents

### **Download Documents**
1. User clicks download button
2. Signed URL generated
3. File downloads to device
4. Download logged in database

---

## Error Handling

### **Upload Errors**
- File too large
- Invalid file type
- Network error
- Storage quota exceeded

### **Download Errors**
- File not found
- Access denied
- Network error

### **Database Errors**
- Connection failed
- Query failed
- Constraint violation

---

## Performance Optimization

### **1. Lazy Loading**
- Load documents on demand
- Pagination (20 per page)
- Virtual scrolling for large lists

### **2. Caching**
- Cache document list (5 min)
- Cache folder list (10 min)
- Invalidate on changes

### **3. Image Optimization**
- Generate thumbnails
- Compress images
- Serve optimized sizes

### **4. Database Queries**
- Use indexes
- Limit results
- Batch operations

---

## Testing Checklist

- [ ] Upload document successfully
- [ ] File size validation works
- [ ] File type validation works
- [ ] Document appears in locker
- [ ] Download document works
- [ ] Create folder works
- [ ] Move document to folder works
- [ ] Delete document works
- [ ] Archive document works
- [ ] Search documents works
- [ ] Filter by type works
- [ ] Sort by date works
- [ ] Mobile responsive
- [ ] Error messages display
- [ ] Success notifications show

---

## Next Steps

1. Create database tables
2. Set up Supabase storage bucket
3. Implement upload modal
4. Implement digital locker page
5. Add folder management
6. Add document preview
7. Add search/filter
8. Test thoroughly
9. Deploy to production

