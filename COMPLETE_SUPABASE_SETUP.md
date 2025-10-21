# Complete Supabase Setup - Database + Storage

## 🎯 Full Setup Process

You need to complete **2 main tasks**:
1. **Database Setup** - Create table with SQL script
2. **Storage Setup** - Create bucket and policies

---

## ⏱️ Time Required: ~15 minutes

---

## 📋 TASK 1: Database Setup (5 minutes)

### Step 1: Run SQL Script

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `QUICK_SUPABASE_SETUP_UPDATED.sql`
6. Copy ALL the code
7. Paste into Supabase SQL Editor
8. Click **Run**
9. Wait for ✓ success message

**What gets created:**
- ✓ `locker_documents` table
- ✓ 3 performance indexes
- ✓ 4 RLS security policies
- ✓ Auto-update timestamp trigger

### Step 2: Test Database

1. Click **New Query**
2. Paste:
```sql
SELECT * FROM locker_documents WHERE user_id = auth.uid();
```
3. Click **Run**
4. Should return empty (no error) ✓

---

## 🪣 TASK 2: Storage Setup (10 minutes)

### Step 1: Create Storage Bucket

1. Go to https://app.supabase.com
2. Select your project
3. Click **Storage** (left sidebar)
4. Click **New bucket**
5. Enter name: `user-documents`
6. **Uncheck** "Make it public" (keep PRIVATE)
7. Click **Create bucket**
8. ✓ Bucket created

### Step 2: Add RLS Policies

1. Click on `user-documents` bucket
2. Click **Policies** tab
3. Click **New Policy** (or use SQL Editor)

**Add Policy 1: Upload**
```sql
CREATE POLICY "Users can upload documents to their folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Add Policy 2: View**
```sql
CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Add Policy 3: Delete**
```sql
CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Step 3: Verify Policies

1. Click on `user-documents` bucket
2. Click **Policies** tab
3. Should see 3 policies ✓

---

## ✅ Complete Checklist

### Database
- [ ] Opened SQL Editor
- [ ] Copied `QUICK_SUPABASE_SETUP_UPDATED.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked Run
- [ ] Got success message
- [ ] Ran test query (returned empty)
- [ ] `locker_documents` table exists

### Storage
- [ ] Went to Storage section
- [ ] Created `user-documents` bucket
- [ ] Bucket is PRIVATE (not public)
- [ ] Added Policy 1: Upload
- [ ] Added Policy 2: View
- [ ] Added Policy 3: Delete
- [ ] All 3 policies show in bucket

### Verification
- [ ] Database test query works
- [ ] Storage bucket exists
- [ ] All policies created
- [ ] Ready for frontend

---

## 📊 What You Now Have

### Database Table: `locker_documents`
```
✓ Stores document metadata
✓ Links to user via RLS
✓ Auto-timestamps
✓ Soft delete support
✓ 39 document types supported
```

### Storage Bucket: `user-documents`
```
✓ Private bucket
✓ Organized by user ID
✓ Max 50MB per file
✓ Supports: PDF, images, Office docs
✓ Encrypted and secure
```

### Security: RLS Policies
```
✓ Database: 4 policies (SELECT, INSERT, UPDATE, DELETE)
✓ Storage: 3 policies (INSERT, SELECT, DELETE)
✓ Users can only access their own data
✓ Fully encrypted and secure
```

---

## 🚨 Common Issues

### Database Issues

**Issue**: "Table does not exist"
- Run the SQL script again
- Make sure you clicked "Run"
- Check for error messages

**Issue**: "Permission denied"
- RLS policies not created
- Run the SQL script again

### Storage Issues

**Issue**: Can't create bucket
- Make sure you're in Storage section
- Check you have admin permissions
- Try refreshing the page

**Issue**: Policies not showing
- Go to SQL Editor
- Paste the policy SQL
- Click Run
- Refresh Storage page

---

## 📁 File Structure After Setup

```
Supabase Project
│
├── Database
│   └── locker_documents table
│       ├── 4 RLS policies
│       ├── 3 indexes
│       └── 39 document types
│
└── Storage
    └── user-documents bucket (PRIVATE)
        ├── 3 RLS policies
        └── File structure: {user_id}/documents/{filename}
```

---

## 🎯 Order of Operations

```
1. Run SQL Script (Database)
   ↓
2. Test Database Query
   ↓
3. Create Storage Bucket
   ↓
4. Add Storage Policies
   ↓
5. Verify Everything
   ↓
6. ✓ Backend Ready!
   ↓
7. Build Frontend
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `QUICK_SUPABASE_SETUP_UPDATED.sql` | Database SQL script |
| `SUPABASE_STORAGE_SETUP.md` | Storage bucket guide |
| `DOCUMENT_TYPES_REFERENCE.md` | Document types list |
| `js/locker-helpers.js` | JavaScript functions |

---

## 🚀 You're Ready!

Follow the 2 tasks above and your backend will be complete.

**Time**: ~15 minutes
**Difficulty**: Easy
**Result**: Fully secure backend ready for frontend development

---

## ✨ What's Next

After completing this setup:
1. Create `js/digital-locker-main.js` (frontend logic)
2. Update `dashboard.html` (upload modal)
3. Update `digital-locker.html` (document display)
4. Update `dashboard.js` (upload handlers)

**Features**:
- Upload documents from dashboard
- View documents in elegant grid
- Edit document names
- Clean modal for viewing
- Download documents
- Search and filter

