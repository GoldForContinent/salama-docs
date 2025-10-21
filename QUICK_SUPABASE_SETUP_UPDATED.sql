-- QUICK SUPABASE SETUP - UPDATED WITH CORRECT DOCUMENT TYPES
-- Copy and paste this entire script into SQL Editor
-- This creates everything needed for Digital Locker

-- ============ CREATE TABLE ============
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
    'national_id', 'passport', 'alien_id', 'refugee_id', 'military_id',
    'driving_license', 'logbook', 'psi_certificate', 'towing_permit', 'badge',
    'kcpe_certificate', 'kcse_certificate', 'university_degree', 'college_diploma', 'transcript', 'student_id',
    'work_permit', 'professional_license', 'practicing_certificate', 'tax_pin', 'business_permit',
    'title_deed', 'lease_agreement', 'allotment_letter', 'court_order', 'power_attorney',
    'bank_card', 'checkbook', 'loan_agreement', 'insurance_policy',
    'birth_certificate', 'death_certificate', 'marriage_certificate', 'medical_report', 'nhif_card',
    'will', 'adoption_papers', 'guardianship', 'other'
  ))
);

-- ============ CREATE INDEXES ============
CREATE INDEX idx_locker_documents_user_id ON locker_documents(user_id);
CREATE INDEX idx_locker_documents_uploaded_at ON locker_documents(uploaded_at DESC);
CREATE INDEX idx_locker_documents_is_archived ON locker_documents(is_archived);

-- ============ ENABLE RLS ============
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;

-- ============ CREATE RLS POLICIES ============
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON locker_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============ CREATE TIMESTAMP FUNCTION ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============ CREATE TRIGGER ============
CREATE TRIGGER update_locker_documents_updated_at
  BEFORE UPDATE ON locker_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============ TEST QUERIES ============
-- Uncomment to test after setup

-- Insert test document
-- INSERT INTO locker_documents (
--   user_id, document_name, document_type, file_path,
--   file_size, mime_type, storage_url, description
-- ) VALUES (
--   auth.uid(),
--   'My National ID',
--   'national_id',
--   'test-path/test.pdf',
--   1024000,
--   'application/pdf',
--   'https://example.com/test.pdf',
--   'Test document'
-- );

-- Query your documents
-- SELECT * FROM locker_documents WHERE user_id = auth.uid();

-- Update document name
-- UPDATE locker_documents
-- SET document_name = 'Updated Name'
-- WHERE user_id = auth.uid()
-- LIMIT 1;
