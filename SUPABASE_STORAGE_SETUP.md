# Supabase Storage Bucket Setup - Complete Guide

## 🪣 What You Need to Create

You need **ONE storage bucket** for the Digital Locker:

| Bucket Name | Visibility | Purpose |
|-------------|-----------|---------|
| `user-documents` | **PRIVATE** | Store user's digital locker documents |

---

## ⚠️ Important Note

You already have a bucket for reports:
- `document-photos` - For report photos (lost/found documents)

**DO NOT use this for digital locker!** Create a separate `user-documents` bucket.

---

## 📋 Step-by-Step: Create Storage Bucket

### Step 1: Go to Supabase Storage

1. Open https://app.supabase.com
2. Select your project
3. Click **Storage** (left sidebar)

### Step 2: Create New Bucket

1. Click **New bucket** button
2. Enter bucket name: `user-documents`
3. **Uncheck** "Make it public" (keep it PRIVATE)
4. Click **Create bucket**

### Step 3: Verify Bucket Created

You should see:
```
✓ user-documents (Private)
```

---

## 🔐 Set Up RLS Policies for Storage Bucket

After creating the bucket, you need to add security policies.

### Go to Storage Policies

1. In Supabase, click **Storage** (left sidebar)
2. Click on `user-documents` bucket
3. Click **Policies** tab

### Add Policy 1: Allow Upload

**Name**: Users can upload documents to their folder

```sql
CREATE POLICY "Users can upload documents to their folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Add Policy 2: Allow View

**Name**: Users can view their own documents

```sql
CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Add Policy 3: Allow Delete

**Name**: Users can delete their own documents

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

## 📁 Bucket Structure

Files will be organized like this:

```
user-documents/
├── {user_id_1}/
│   └── documents/
│       ├── abc123.pdf
│       ├── def456.jpg
│       └── ghi789.docx
├── {user_id_2}/
│   └── documents/
│       └── xyz789.pdf
└── {user_id_3}/
    └── documents/
        └── doc123.pdf
```

**Path format**: `{user_id}/documents/{document_id}.{extension}`

**Example**: `550e8400-e29b-41d4-a716-446655440000/documents/abc123.pdf`

---

## 🔒 Security Features

### Private Bucket
- Files are NOT publicly accessible
- Users can only access their own files
- RLS policies enforce security

### RLS Policies
- Users can only upload to their own folder
- Users can only view their own documents
- Users can only delete their own documents
- No one can access other users' files

### File Encryption
- Supabase encrypts all files at rest
- HTTPS for all transfers
- Secure and compliant

---

## 📊 Complete Setup Checklist

### Database Setup
- [ ] Run `QUICK_SUPABASE_SETUP_UPDATED.sql` in SQL Editor
- [ ] `locker_documents` table created
- [ ] RLS policies created (4 policies)
- [ ] Indexes created (3 indexes)

### Storage Setup
- [ ] Create `user-documents` bucket (PRIVATE)
- [ ] Add RLS Policy 1: Upload
- [ ] Add RLS Policy 2: View
- [ ] Add RLS Policy 3: Delete

### Verification
- [ ] Test SQL query works
- [ ] Bucket appears in Storage section
- [ ] Policies show in bucket settings

---

## 🧪 Test the Setup

### Test 1: Verify Bucket Exists

1. Go to Storage section
2. Look for `user-documents` bucket
3. Should show as "Private" ✓

### Test 2: Verify Policies Exist

1. Click on `user-documents` bucket
2. Click "Policies" tab
3. Should see 3 policies ✓

### Test 3: Try Upload (Optional)

You can test uploading a file using the Supabase dashboard:
1. Click on `user-documents` bucket
2. Click "Upload file"
3. Select a test file
4. Should upload successfully ✓

---

## 📝 File Size Limits

| Limit | Value |
|-------|-------|
| Max file size | 50 MB |
| Max bucket size | 100 GB (default) |
| Allowed types | PDF, JPEG, PNG, GIF, WebP, DOC, DOCX |

---

## 🚨 Common Issues

### Issue: Can't create bucket
**Solution**: 
- Make sure you're in the Storage section
- Check you have admin permissions
- Try refreshing the page

### Issue: Policies not showing
**Solution**:
- Go to SQL Editor
- Paste the policy SQL
- Click Run
- Refresh the Storage page

### Issue: Can't upload files
**Solution**:
- Check bucket is PRIVATE (not public)
- Verify RLS policies are created
- Check user is authenticated
- Check file size (max 50MB)

---

## 📚 Related Files

- **QUICK_SUPABASE_SETUP_UPDATED.sql** - Database setup
- **js/locker-helpers.js** - Upload functions
- **SUPABASE_DIGITAL_LOCKER_SETUP.md** - Detailed guide
- **BACKEND_SETUP_SUMMARY.md** - Quick reference

---

## ✅ Summary

**You need to:**
1. Create `user-documents` bucket (PRIVATE)
2. Add 3 RLS policies
3. Verify everything works

**Then you're ready for frontend development!**

---

## 🎯 Order of Setup

1. ✓ Create database table (SQL script)
2. → Create storage bucket (this guide)
3. → Build frontend
4. → Test upload flow

