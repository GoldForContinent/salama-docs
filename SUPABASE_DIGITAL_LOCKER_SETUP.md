# Supabase Digital Locker Setup Guide

## Overview
This guide will help you set up the Supabase backend for the Digital Locker feature. You'll need to:
1. Create the `locker_documents` table
2. Set up RLS (Row Level Security) policies
3. Configure the `user-documents` storage bucket
4. Test the setup

---

## Step 1: Create the `locker_documents` Table

Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
-- Create locker_documents table
CREATE TABLE IF NOT EXISTS locker_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_document_type CHECK (document_type IN (
    'national_id', 'passport', 'driving_license', 'kra_pin',
    'birth_certificate', 'marriage_certificate', 'death_certificate',
    'school_certificate', 'university_degree', 'college_diploma',
    'work_permit', 'business_permit', 'title_deed', 'lease_agreement',
    'insurance_policy', 'medical_report', 'bank_statement',
    'loan_agreement', 'power_attorney', 'will', 'other'
  ))
);

-- Create index for faster queries
CREATE INDEX idx_locker_documents_user_id ON locker_documents(user_id);
CREATE INDEX idx_locker_documents_uploaded_at ON locker_documents(uploaded_at DESC);
CREATE INDEX idx_locker_documents_is_archived ON locker_documents(is_archived);

-- Enable RLS
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Users can SELECT only their own documents
CREATE POLICY "Users can view their own documents"
  ON locker_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own documents
CREATE POLICY "Users can insert their own documents"
  ON locker_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own documents
CREATE POLICY "Users can update their own documents"
  ON locker_documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own documents
CREATE POLICY "Users can delete their own documents"
  ON locker_documents
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Step 2: Verify Storage Bucket

Check if the `user-documents` storage bucket exists:

1. Go to Supabase Dashboard → Storage
2. Look for `user-documents` bucket
3. If it doesn't exist, create it:
   - Click "New bucket"
   - Name: `user-documents`
   - Make it **Private** (not public)
   - Click "Create bucket"

---

## Step 3: Set Up Storage Bucket RLS Policies

Go to Storage → Policies and add these policies for `user-documents` bucket:

```sql
-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload documents to their folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 2: Allow authenticated users to view their own documents
CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Step 4: Create Helper Function for Updated Timestamps

This function automatically updates the `updated_at` column:

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for locker_documents
CREATE TRIGGER update_locker_documents_updated_at
  BEFORE UPDATE ON locker_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 5: Test the Setup

### Test 1: Insert a Document (via SQL)

```sql
-- This should work (user_id matches auth.uid())
INSERT INTO locker_documents (
  user_id,
  document_name,
  document_type,
  file_path,
  file_size,
  mime_type,
  storage_url,
  description
) VALUES (
  auth.uid(),
  'My National ID',
  'national_id',
  'user-id/documents/doc-123.pdf',
  1024000,
  'application/pdf',
  'https://zfywzczelvbsoptwrrpj.supabase.co/storage/v1/object/public/user-documents/user-id/documents/doc-123.pdf',
  'Front and back copy of my national ID'
);
```

### Test 2: Query Your Documents

```sql
-- This should return only your documents
SELECT * FROM locker_documents WHERE user_id = auth.uid();
```

### Test 3: Update Document Name

```sql
-- Update a document name
UPDATE locker_documents
SET document_name = 'Updated Document Name'
WHERE id = 'your-document-id' AND user_id = auth.uid();
```

---

## Database Schema Summary

### locker_documents Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| document_name | TEXT | Name of the document (editable) |
| document_type | TEXT | Type of document (national_id, passport, etc.) |
| file_path | TEXT | Path in storage bucket |
| file_size | INTEGER | Size in bytes |
| mime_type | TEXT | MIME type (application/pdf, image/jpeg, etc.) |
| storage_url | TEXT | Public URL for viewing/downloading |
| description | TEXT | Optional description |
| tags | TEXT[] | Array of tags for organization |
| is_archived | BOOLEAN | Whether document is archived |
| uploaded_at | TIMESTAMP | When document was uploaded |
| updated_at | TIMESTAMP | When document was last updated |

---

## Storage Bucket Configuration

### Bucket: `user-documents`

- **Visibility**: Private
- **Path Structure**: `{user_id}/documents/{document_id}.{extension}`
- **Example**: `550e8400-e29b-41d4-a716-446655440000/documents/abc123.pdf`

### RLS Policies:
- Users can only upload to their own folder
- Users can only view their own documents
- Users can only delete their own documents

---

## Important Notes

1. **Storage Path Format**: Always use `{user_id}/documents/{filename}` to ensure RLS policies work
2. **File Size Limit**: Currently set to 50MB per file (can be adjusted in frontend validation)
3. **Document Types**: Only specific types are allowed (see CONSTRAINT in SQL)
4. **Timestamps**: `uploaded_at` is set automatically, `updated_at` updates on changes
5. **Soft Delete**: Use `is_archived` flag instead of hard delete for data recovery

---

## Troubleshooting

### Issue: "Permission denied" when uploading
- Check that storage bucket is named exactly `user-documents`
- Verify RLS policies are created
- Ensure user is authenticated

### Issue: Can't see documents after upload
- Check that `user_id` in database matches `auth.uid()`
- Verify RLS policies are enabled
- Check browser console for errors

### Issue: File upload fails
- Check file size (max 50MB)
- Check MIME type is allowed
- Verify storage bucket exists and is private

---

## Next Steps

After completing this setup:
1. Create `js/locker-helpers.js` with Supabase operations
2. Create `js/digital-locker-main.js` with frontend logic
3. Update `dashboard.html` and `digital-locker.html`
4. Test upload flow from dashboard

