# Digital Locker Setup Guide

## Quick Summary

You now have a complete digital locker system with:
- ✅ Upload modal on dashboard
- ✅ Document storage in Supabase
- ✅ Folder organization system
- ✅ Search, filter, and sort functionality
- ✅ Document preview and download
- ✅ Mobile-responsive design

---

## Step 1: Supabase Configuration

### Create Storage Bucket

1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. Click **Create a new bucket**
4. Name it: `user-documents`
5. Set to **Private** (not public)
6. Click **Create bucket**

### Configure Bucket Settings

1. Click on `user-documents` bucket
2. Go to **Configuration**
3. Set allowed MIME types:
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   application/pdf
   application/msword
   application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```
4. Set max file size: `52428800` (50MB)
5. Save

### Set RLS Policies

Create these policies for the bucket:

**Policy 1: SELECT (Users can view their own documents)**
```sql
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: INSERT (Users can upload their own documents)**
```sql
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: DELETE (Users can delete their own documents)**
```sql
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Step 2: Database Setup

### Create Tables

Run these SQL queries in Supabase SQL Editor:

```sql
-- Create locker_documents table
CREATE TABLE locker_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES locker_folders(id) ON DELETE SET NULL,
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

-- Create locker_folders table
CREATE TABLE locker_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#006600',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, folder_name)
);

-- Create indexes
CREATE INDEX idx_locker_user ON locker_documents(user_id);
CREATE INDEX idx_locker_folder ON locker_documents(folder_id);
CREATE INDEX idx_locker_archived ON locker_documents(is_archived);
CREATE INDEX idx_folder_user ON locker_folders(user_id);

-- Enable RLS
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE locker_folders ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

```sql
-- locker_documents policies
CREATE POLICY "Users can view their own documents"
ON locker_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON locker_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON locker_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON locker_documents
FOR DELETE
USING (auth.uid() = user_id);

-- locker_folders policies
CREATE POLICY "Users can view their own folders"
ON locker_folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
ON locker_folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON locker_folders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON locker_folders
FOR DELETE
USING (auth.uid() = user_id);
```

---

## Step 3: Update Dashboard HTML

Update `dashboard.html` to include the upload modal and new scripts:

```html
<!-- Add before closing </body> tag -->
<script type="module" src="js/locker-utils.js"></script>
<script type="module" src="js/locker-upload-modal.js"></script>
<link rel="stylesheet" href="css/locker-enhanced.css">

<!-- Update the upload button onclick -->
<button class="locker-btn" onclick="window.openLockerUploadModal()">
  <i class="fas fa-upload"></i> Upload Document
</button>
```

---

## Step 4: Update Digital Locker Page

Replace `digital-locker.html` with enhanced version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salama Docs - Digital Locker</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/digital-locker.css">
    <link rel="stylesheet" href="css/locker-enhanced.css">
</head>
<body>
    <header>
        <div class="container header-content">
            <div class="logo">
                <i class="fas fa-id-card"></i>
                <h1>Digital Locker</h1>
            </div>
            <div class="user-profile">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" id="userProfileImg">
            </div>
        </div>
    </header>
    
    <main class="container">
        <!-- Statistics -->
        <div id="lockerStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:30px;">
        </div>

        <!-- Controls -->
        <div class="controls" style="display:flex;gap:15px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
            <input type="text" id="searchDocuments" placeholder="Search documents..." 
              style="flex:1;min-width:200px;padding:10px;border:1px solid #ddd;border-radius:6px;">
            
            <select id="filterDocType" style="padding:10px;border:1px solid #ddd;border-radius:6px;">
              <option value="">All Types</option>
              <!-- Options populated by JS -->
            </select>

            <select id="sortDocuments" style="padding:10px;border:1px solid #ddd;border-radius:6px;">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-asc">Smallest First</option>
              <option value="size-desc">Largest First</option>
            </select>

            <button id="gridViewBtn" class="view-btn active" onclick="setViewMode('grid')">
              <i class="fas fa-th"></i>
            </button>
            <button id="listViewBtn" class="view-btn" onclick="setViewMode('list')">
              <i class="fas fa-list"></i>
            </button>

            <button class="btn" onclick="window.location.href='dashboard.html'">
              <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>

        <!-- Folders Section -->
        <div style="margin-bottom:30px;">
          <h2>My Folders</h2>
          <div id="foldersContainer" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;">
          </div>
        </div>

        <!-- Documents Grid -->
        <div style="margin-bottom:30px;">
          <h2>My Documents</h2>
          <div class="documents-grid" id="documentsContainer">
            <!-- Documents populated by JS -->
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" id="emptyState">
            <i class="fas fa-folder-open"></i>
            <h3>Your digital locker is empty</h3>
            <p>Upload your first document to get started</p>
            <button class="btn" onclick="window.location.href='dashboard.html'">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
    </main>

    <script type="module" src="js/locker-utils.js"></script>
    <script type="module" src="js/digital-locker-enhanced.js"></script>
</body>
</html>
```

---

## Step 5: Update Dashboard JavaScript

Add to `dashboard.js` in the appropriate section:

```javascript
// Import locker utilities
import { initializeUploadModal } from './locker-upload-modal.js';

// In DOMContentLoaded or initialization function
await initializeUploadModal();
```

---

## File Structure

```
project/
├── js/
│   ├── locker-utils.js              (Helper functions)
│   ├── locker-upload-modal.js       (Upload modal)
│   ├── digital-locker-enhanced.js   (Main page logic)
│   └── dashboard.js                 (Updated with locker integration)
├── css/
│   ├── locker-enhanced.css          (Locker styles)
│   └── digital-locker.css           (Original styles)
└── digital-locker.html              (Updated page)
```

---

## Storage Bucket Structure

```
user-documents/
├── {user_id}/
│   ├── documents/
│   │   ├── {doc_id}.pdf
│   │   ├── {doc_id}.jpg
│   │   └── ...
│   └── thumbnails/
│       └── {doc_id}_thumb.jpg
```

---

## Features Implemented

### Upload Modal
- ✅ Document type selector
- ✅ Drag & drop file upload
- ✅ File size validation (50MB max)
- ✅ Folder selection
- ✅ Description and tags
- ✅ Upload progress bar
- ✅ Error handling

### Digital Locker Page
- ✅ Grid and list view toggle
- ✅ Search functionality
- ✅ Filter by document type
- ✅ Sort by date, name, size
- ✅ Document preview
- ✅ Download documents
- ✅ Folder organization
- ✅ Archive documents
- ✅ Delete documents
- ✅ Statistics dashboard

### Folder Management
- ✅ Create folders
- ✅ Assign colors to folders
- ✅ Move documents to folders
- ✅ View folder contents
- ✅ Delete folders

---

## Testing Checklist

- [ ] Upload document from dashboard
- [ ] Document appears in digital locker
- [ ] Download document works
- [ ] Preview document works
- [ ] Create folder works
- [ ] Move document to folder works
- [ ] Search documents works
- [ ] Filter by type works
- [ ] Sort by date/name/size works
- [ ] Delete document works
- [ ] Archive document works
- [ ] Mobile responsive
- [ ] Error messages display
- [ ] Success notifications show

---

## Troubleshooting

### Upload fails
- Check file size (max 50MB)
- Check file type (images, PDF only)
- Check Supabase bucket permissions
- Check RLS policies

### Documents not appearing
- Check user authentication
- Check RLS policies
- Check database records
- Check browser console for errors

### Download fails
- Check storage URL
- Check file permissions
- Check browser security settings

---

## Security Notes

1. **Authentication**: Only logged-in users can access
2. **Authorization**: Users can only access their own documents
3. **Storage**: Files stored in private bucket
4. **Validation**: File type and size validated
5. **Encryption**: HTTPS for all transfers

---

## Performance Tips

1. **Lazy Loading**: Load documents on demand
2. **Pagination**: Show 20 documents per page
3. **Caching**: Cache folder list (10 min)
4. **Compression**: Compress images before upload
5. **Indexing**: Use database indexes for queries

---

## Next Steps

1. ✅ Set up Supabase bucket
2. ✅ Create database tables
3. ✅ Add RLS policies
4. ✅ Update HTML files
5. ✅ Test upload functionality
6. ✅ Test document management
7. ✅ Deploy to production

