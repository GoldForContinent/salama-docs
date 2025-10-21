# 🚀 Quick Start - Supabase Setup

## You Need 2 Things

### 1️⃣ DATABASE TABLE
```
✓ locker_documents table
✓ 39 document types
✓ RLS security
✓ Auto-timestamps
```

### 2️⃣ STORAGE BUCKET
```
✓ user-documents bucket (PRIVATE)
✓ Store actual files
✓ RLS security
✓ Max 50MB per file
```

---

## ⏱️ 15 Minutes to Complete

---

## 📋 STEP 1: Database (5 min)

```
1. Go to Supabase SQL Editor
2. Copy: QUICK_SUPABASE_SETUP_UPDATED.sql
3. Paste into SQL Editor
4. Click Run
5. ✓ Done!
```

**Verify:**
```sql
SELECT * FROM locker_documents WHERE user_id = auth.uid();
```
Should return empty (no error) ✓

---

## 🪣 STEP 2: Storage (10 min)

### Create Bucket
```
1. Go to Storage section
2. Click "New bucket"
3. Name: user-documents
4. Visibility: PRIVATE (uncheck "Make it public")
5. Click "Create bucket"
6. ✓ Done!
```

### Add Policies (3 policies)

**Policy 1: Upload**
```sql
CREATE POLICY "Users can upload documents to their folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Policy 2: View**
```sql
CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Policy 3: Delete**
```sql
CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## ✅ Verification

- [ ] Database table created
- [ ] Test query works
- [ ] Storage bucket exists (PRIVATE)
- [ ] 3 storage policies added
- [ ] Ready for frontend!

---

## 📁 What You Have Now

```
Supabase
├── Database
│   └── locker_documents (39 types, RLS, indexes)
└── Storage
    └── user-documents (PRIVATE, RLS policies)
```

---

## 🎯 Next: Frontend Development

Once backend is done:
1. Create upload modal
2. Create document display
3. Add view/edit/download
4. Add search/filter

---

## 📚 Full Guides

- **COMPLETE_SUPABASE_SETUP.md** - Detailed instructions
- **SUPABASE_STORAGE_SETUP.md** - Storage bucket guide
- **QUICK_SUPABASE_SETUP_UPDATED.sql** - SQL script

---

**Ready? Start with STEP 1!** 🚀

