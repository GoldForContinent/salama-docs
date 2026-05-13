-- ════════════════════════════════════════════════════
-- SALAMA DOCS — Schema Migration (Missing Tables & RPC)
-- Run this entire block in Supabase SQL Editor AFTER
-- database-rls-policies.sql
-- ════════════════════════════════════════════════════

-- ── 0. Auto-create profile on auth signup ──────────
-- This is THE fix for "profile not loading": when Supabase Auth creates a user,
-- this trigger automatically inserts a profiles row (bypasses RLS via SECURITY DEFINER).
-- The name/phone come from user_metadata set during signUp().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 1. recovered_reports table ──────────────────────
CREATE TABLE IF NOT EXISTS recovered_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  found_report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'recovered',
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovered_reports_lost ON recovered_reports(lost_report_id);
CREATE INDEX IF NOT EXISTS idx_recovered_reports_found ON recovered_reports(found_report_id);
CREATE INDEX IF NOT EXISTS idx_recovered_reports_status ON recovered_reports(status);

ALTER TABLE recovered_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovered_reports: users can read own"
ON recovered_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE (reports.id = recovered_reports.lost_report_id OR reports.id = recovered_reports.found_report_id)
      AND reports.user_id = auth.uid()
  )
);

CREATE POLICY "recovered_reports: system_admin reads all"
ON recovered_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "recovered_reports: authenticated can insert"
ON recovered_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "recovered_reports: users can update own related"
ON recovered_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE (reports.id = recovered_reports.lost_report_id OR reports.id = recovered_reports.found_report_id)
      AND reports.user_id = auth.uid()
  )
);

-- ── 2. transactions table ──────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('recovery', 'reward', 'payment')),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  phone_number VARCHAR(20),
  provider VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_report ON transactions(report_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: users read own"
ON transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "transactions: system_admin reads all"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "transactions: authenticated can insert"
ON transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "transactions: users update own"
ON transactions FOR UPDATE
USING (user_id = auth.uid());

-- ── 3. create_match_transactions RPC ───────────────
CREATE OR REPLACE FUNCTION create_match_transactions(
  recovery_data JSONB,
  reward_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recovery_id UUID;
  reward_id UUID;
  result JSONB;
BEGIN
  INSERT INTO transactions (
    report_id, transaction_type, amount, status,
    user_id, phone_number, provider, notes
  ) VALUES (
    (recovery_data->>'report_id')::UUID,
    'recovery',
    (recovery_data->>'amount')::NUMERIC,
    'pending',
    (recovery_data->>'user_id')::UUID,
    recovery_data->>'phone_number',
    recovery_data->>'provider',
    recovery_data->>'notes'
  )
  RETURNING id INTO recovery_id;

  INSERT INTO transactions (
    report_id, transaction_type, amount, status,
    user_id, phone_number, provider, notes
  ) VALUES (
    (reward_data->>'report_id')::UUID,
    'reward',
    (reward_data->>'amount')::NUMERIC,
    'pending',
    (reward_data->>'user_id')::UUID,
    reward_data->>'phone_number',
    reward_data->>'provider',
    reward_data->>'notes'
  )
  RETURNING id INTO reward_id;

  result := jsonb_build_object(
    'recovery_id', recovery_id,
    'reward_id', reward_id,
    'success', true
  );

  RETURN result;
END;
$$;
