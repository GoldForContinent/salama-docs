# Digital Locker Backend - Visual Setup Guide

## 🎯 Your Goal
Set up Supabase backend so users can upload, store, and manage documents securely.

---

## 📋 The 3-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SETUP FLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: CREATE DATABASE TABLE
  ↓
  Supabase SQL Editor
  ↓
  Copy QUICK_SUPABASE_SETUP.sql
  ↓
  Run SQL script
  ↓
  ✓ locker_documents table created
  ✓ RLS policies created
  ✓ Indexes created
  ✓ Triggers created

Step 2: VERIFY STORAGE BUCKET
  ↓
  Supabase Storage section
  ↓
  Check for "user-documents" bucket
  ↓
  If missing, create it (Private)
  ↓
  ✓ Bucket ready for file uploads

Step 3: TEST IT WORKS
  ↓
  Run test SQL query
  ↓
  Should return empty (no error)
  ↓
  ✓ Backend is ready!
```

---

## 🔧 Step-by-Step Instructions

### STEP 1️⃣: Set Up Database (5 minutes)

```
1. Open browser → https://app.supabase.com
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Open file: QUICK_SUPABASE_SETUP.sql
6. Copy ALL the code
7. Paste into Supabase SQL Editor
8. Click "Run" button
9. Wait for ✓ success message
```

**What gets created:**
```
✓ locker_documents table
✓ 3 indexes for performance
✓ RLS security policies (4 policies)
✓ Timestamp update function
✓ Auto-update trigger
```

---

### STEP 2️⃣: Verify Storage Bucket (2 minutes)

```
1. In Supabase, click "Storage" (left sidebar)
2. Look for "user-documents" bucket
3. 
   IF EXISTS:
   → You're done! ✓
   
   IF MISSING:
   → Click "New bucket"
   → Name: user-documents
   → Visibility: PRIVATE (not public!)
   → Click "Create bucket"
   → Done! ✓
```

**Bucket structure:**
```
user-documents/
├── user-id-1/
│   └── documents/
│       ├── doc1.pdf
│       ├── doc2.jpg
│       └── doc3.docx
├── user-id-2/
│   └── documents/
│       └── doc1.pdf
└── user-id-3/
    └── documents/
        └── doc1.pdf
```

---

### STEP 3️⃣: Test It Works (2 minutes)

```
1. In Supabase SQL Editor, click "New Query"
2. Paste this code:

   SELECT * FROM locker_documents 
   WHERE user_id = auth.uid();

3. Click "Run"
4. 
   EXPECTED RESULT:
   → Empty table (0 rows) - This is correct! ✓
   
   ERROR RESULT:
   → "Table does not exist" - Run Step 1 again
   → "Permission denied" - Check RLS policies
```

---

## 📊 Database Schema Visualization

```
┌─────────────────────────────────────────────────────────┐
│              locker_documents TABLE                      │
├─────────────────────────────────────────────────────────┤
│ Column           │ Type      │ Description              │
├──────────────────┼───────────┼──────────────────────────┤
│ id               │ UUID      │ Unique ID (auto)         │
│ user_id          │ UUID      │ Links to user (secure)   │
│ document_name    │ TEXT      │ Name (editable)          │
│ document_type    │ TEXT      │ Type (national_id, etc)  │
│ file_path        │ TEXT      │ Where file is stored     │
│ file_size        │ INTEGER   │ Size in bytes            │
│ mime_type        │ TEXT      │ File type (pdf, jpg)     │
│ storage_url      │ TEXT      │ URL for viewing/download │
│ description      │ TEXT      │ Optional notes           │
│ tags             │ TEXT[]    │ Array of tags            │
│ is_archived      │ BOOLEAN   │ Soft delete flag         │
│ uploaded_at      │ TIMESTAMP │ When uploaded (auto)     │
│ updated_at       │ TIMESTAMP │ Last updated (auto)      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security: RLS Policies

```
┌──────────────────────────────────────────────────────────┐
│           ROW LEVEL SECURITY (RLS) POLICIES              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Policy 1: SELECT                                         │
│ ├─ User can view their own documents                     │
│ └─ WHERE: auth.uid() = user_id                           │
│                                                          │
│ Policy 2: INSERT                                         │
│ ├─ User can upload their own documents                   │
│ └─ WHERE: auth.uid() = user_id                           │
│                                                          │
│ Policy 3: UPDATE                                         │
│ ├─ User can edit their own documents                     │
│ └─ WHERE: auth.uid() = user_id                           │
│                                                          │
│ Policy 4: DELETE                                         │
│ ├─ User can delete their own documents                   │
│ └─ WHERE: auth.uid() = user_id                           │
│                                                          │
└──────────────────────────────────────────────────────────┘

Result: Each user can ONLY access their own data ✓
```

---

## 💾 Storage Bucket Structure

```
user-documents (PRIVATE BUCKET)
│
├── Storage Path Format:
│   {user_id}/documents/{document_id}.{extension}
│
├── Example:
│   550e8400-e29b-41d4-a716-446655440000/documents/abc123.pdf
│
├── Security:
│   ✓ Private (not publicly accessible)
│   ✓ RLS policies enforce user access
│   ✓ Encrypted by Supabase
│   ✓ Max 50MB per file
│
└── Allowed Types:
    ✓ Images: JPEG, PNG, GIF, WebP
    ✓ Documents: PDF, DOC, DOCX
```

---

## 📁 Files Created For You

```
Your Project Folder
│
├── QUICK_SUPABASE_SETUP.sql ⭐ START HERE
│   └─ Copy and paste into Supabase SQL Editor
│
├── SUPABASE_DIGITAL_LOCKER_SETUP.md
│   └─ Detailed explanation of each step
│
├── DIGITAL_LOCKER_BACKEND_SETUP.md
│   └─ Complete checklist and reference
│
├── BACKEND_SETUP_SUMMARY.md
│   └─ Quick reference guide
│
├── SETUP_VISUAL_GUIDE.md (this file)
│   └─ Visual walkthrough
│
└── js/locker-helpers.js ✓ READY TO USE
    └─ All Supabase functions for frontend
```

---

## ✅ Verification Checklist

After completing all 3 steps:

```
Database Setup
├─ [ ] SQL script ran without errors
├─ [ ] locker_documents table exists
├─ [ ] RLS policies created (4 total)
├─ [ ] Indexes created (3 total)
└─ [ ] Timestamp trigger created

Storage Setup
├─ [ ] user-documents bucket exists
├─ [ ] Bucket is PRIVATE (not public)
└─ [ ] Storage RLS policies created

Testing
├─ [ ] Test query ran successfully
├─ [ ] No permission errors
├─ [ ] Empty result returned (correct!)
└─ [ ] Ready for frontend development
```

---

## 🚀 What Happens Next

Once backend is verified:

```
PHASE 2: FRONTEND DEVELOPMENT
│
├─ Create js/digital-locker-main.js
│  └─ Main application logic
│
├─ Update dashboard.html
│  └─ Upload modal
│
├─ Update digital-locker.html
│  └─ Document display
│
└─ Update dashboard.js
   └─ Upload handlers

FEATURES:
✓ Upload documents from dashboard
✓ View documents in elegant grid
✓ Edit document names
✓ Clean modal for viewing
✓ Download documents
✓ Search and filter
```

---

## 🎓 Key Concepts

### What is RLS?
Row Level Security ensures users can only access their own data. Even if someone tries to hack the database, they can only see their own documents.

### What is a Storage Bucket?
A folder in Supabase where files are stored. Like Google Drive, but for your app. Private means only you can access your files.

### What is a UUID?
A unique identifier (like a super-long ID number). Every document gets one automatically.

### What is a Trigger?
Automatic action. When you update a document, the `updated_at` timestamp automatically updates.

---

## 📞 Troubleshooting

### ❌ "Table does not exist"
```
→ Step 1 SQL didn't run successfully
→ Copy QUICK_SUPABASE_SETUP.sql again
→ Make sure you clicked "Run" button
→ Check for error messages in Supabase
```

### ❌ "Permission denied"
```
→ RLS policies not created
→ Run Step 1 SQL again
→ Make sure all 4 policies were created
→ Check Supabase SQL Editor for errors
```

### ❌ Can't find storage bucket
```
→ Bucket might be named differently
→ Go to Storage section
→ Look for "user-documents"
→ If missing, create it (Private!)
```

### ❌ Test query returns error
```
→ Make sure you're logged in to Supabase
→ Check table name is "locker_documents"
→ Verify RLS policies exist
→ Try running the SQL script again
```

---

## 🎯 Success Indicators

You'll know it's working when:

✅ SQL script runs without errors
✅ `locker_documents` table appears in Supabase
✅ `user-documents` storage bucket exists
✅ Test query returns empty result (no error)
✅ No permission errors in console
✅ Ready to start frontend development

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_SUPABASE_SETUP.sql` | Copy-paste SQL script |
| `SUPABASE_DIGITAL_LOCKER_SETUP.md` | Detailed guide |
| `DIGITAL_LOCKER_BACKEND_SETUP.md` | Checklist & reference |
| `BACKEND_SETUP_SUMMARY.md` | Quick summary |
| `SETUP_VISUAL_GUIDE.md` | This file - visual walkthrough |
| `js/locker-helpers.js` | JavaScript functions ready to use |

---

## 🎉 You're Ready!

Follow the 3 steps above, and your backend will be ready for frontend development.

**Next**: Let me know when backend is set up, and we'll build the beautiful frontend! 🚀

