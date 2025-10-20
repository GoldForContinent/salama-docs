# Digital Locker - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### **Step 1: Create Supabase Bucket**
```
1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: user-documents
4. Set to Private
5. Click Create
```

### **Step 2: Create Database Tables**
Copy and paste this in Supabase SQL Editor:

```sql
-- Create tables
CREATE TABLE locker_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  folder_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#006600',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, folder_name)
);

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
  is_archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  UNIQUE(user_id, file_path)
);

-- Create indexes
CREATE INDEX idx_locker_user ON locker_documents(user_id);
CREATE INDEX idx_locker_folder ON locker_documents(folder_id);
CREATE INDEX idx_folder_user ON locker_folders(user_id);

-- Enable RLS
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE locker_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own documents"
ON locker_documents FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON locker_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON locker_documents FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON locker_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders"
ON locker_folders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
ON locker_folders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON locker_folders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON locker_folders FOR DELETE USING (auth.uid() = user_id);
```

### **Step 3: Update Dashboard**
In `dashboard.html`, add before `</body>`:
```html
<script type="module" src="js/locker-utils.js"></script>
<script type="module" src="js/locker-upload-modal.js"></script>
<link rel="stylesheet" href="css/locker-enhanced.css">
```

Update the upload button:
```html
<button class="locker-btn" onclick="window.openLockerUploadModal()">
  <i class="fas fa-upload"></i> Upload Document
</button>
```

### **Step 4: Add Files**
Copy these files to your project:
- `js/locker-utils.js`
- `js/locker-upload-modal.js`
- `js/digital-locker-enhanced.js`
- `css/locker-enhanced.css`

### **Step 5: Update Digital Locker Page**
Replace `digital-locker.html` content with the enhanced version from the setup guide.

---

## 📁 File Structure

```
project/
├── js/
│   ├── locker-utils.js
│   ├── locker-upload-modal.js
│   ├── digital-locker-enhanced.js
│   └── dashboard.js (updated)
├── css/
│   ├── locker-enhanced.css
│   └── digital-locker.css
└── digital-locker.html (updated)
```

---

## 🎯 Features

| Feature | Status |
|---------|--------|
| Upload documents | ✅ |
| Organize in folders | ✅ |
| Search documents | ✅ |
| Filter by type | ✅ |
| Sort by date/name/size | ✅ |
| Preview documents | ✅ |
| Download documents | ✅ |
| Archive documents | ✅ |
| Delete documents | ✅ |
| Mobile responsive | ✅ |

---

## 💾 Storage Bucket

**Name**: `user-documents`
**Type**: Private
**Max File Size**: 50MB
**Allowed Types**: Images, PDF, Word docs

---

## 📊 Database Tables

### locker_documents
- Stores document metadata
- Links to user and folder
- Tracks upload date, size, type
- Supports tags and descriptions

### locker_folders
- Stores folder information
- Supports custom colors
- Tracks creation date

---

## 🔒 Security

- ✅ User authentication required
- ✅ RLS policies enforce user isolation
- ✅ Private storage bucket
- ✅ File type validation
- ✅ File size limits
- ✅ HTTPS encryption

---

## 🧪 Testing

```javascript
// Test upload
1. Click "Upload Document" on dashboard
2. Select document type
3. Choose file (drag & drop or click)
4. Click Upload
5. Check digital locker page

// Test organization
1. Create folder
2. Move document to folder
3. View folder contents

// Test search
1. Enter search term
2. Verify results

// Test download
1. Click download button
2. Verify file downloads
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload fails | Check file size (max 50MB) and type |
| Documents not showing | Check RLS policies and user auth |
| Download fails | Check storage URL and permissions |
| Folder not created | Check user_id and unique constraint |

---

## 📱 Mobile Support

- ✅ Responsive design
- ✅ Touch-friendly buttons
- ✅ Mobile-optimized layout
- ✅ Works on all devices

---

## 🚀 Deployment

1. ✅ Set up Supabase bucket
2. ✅ Create database tables
3. ✅ Add RLS policies
4. ✅ Update HTML files
5. ✅ Add JavaScript files
6. ✅ Add CSS files
7. ✅ Test functionality
8. ✅ Deploy to production

---

## 📚 Documentation

- **DIGITAL_LOCKER_IMPLEMENTATION.md** - Detailed architecture
- **DIGITAL_LOCKER_SETUP_GUIDE.md** - Step-by-step setup
- **DIGITAL_LOCKER_SUMMARY.md** - Complete overview

---

## ✨ Key Benefits

- 🔐 Secure document storage
- 📁 Organized folder system
- 🔍 Easy search and filter
- 📥 Quick download
- 📱 Mobile friendly
- ⚡ Fast and responsive
- 🛡️ Private and encrypted

---

## 🎓 Usage Example

### Upload Document
```javascript
// User clicks "Upload Document"
// Modal opens
// User selects type, file, folder
// User clicks Upload
// Document stored in Supabase
// Document appears in locker
```

### Organize Documents
```javascript
// User creates folder "Important"
// User moves documents to folder
// User views folder contents
// User can search within folder
```

### Download Document
```javascript
// User clicks download button
// File downloads to device
// User can print or view offline
```

---

## 🔗 Integration Points

1. **Dashboard**: Upload button opens modal
2. **Digital Locker**: Display and manage documents
3. **Supabase Storage**: Store files
4. **Supabase Database**: Store metadata
5. **Authentication**: User verification

---

## 📞 Support

For help:
1. Check browser console (F12)
2. Check Supabase logs
3. Verify RLS policies
4. Check file permissions
5. Review documentation

---

## ✅ Checklist

- [ ] Supabase bucket created
- [ ] Database tables created
- [ ] RLS policies added
- [ ] Dashboard updated
- [ ] Digital locker updated
- [ ] Files copied
- [ ] CSS linked
- [ ] JavaScript imported
- [ ] Upload tested
- [ ] Download tested
- [ ] Mobile tested
- [ ] Ready to deploy

---

## 🎉 You're Ready!

Your digital locker system is now ready to use. Users can:
- Upload important documents
- Organize in folders
- Search and filter
- Download anytime
- Keep soft copies safe

Happy document management! 📄✨

