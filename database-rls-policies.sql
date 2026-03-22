-- ════════════════════════════════════════════════════
-- SALAMA DOCS — RLS Policies & Data Fixes
-- Run this entire block in Supabase SQL Editor
-- ════════════════════════════════════════════════════

-- ── 1. admin_roles: Public read (not sensitive) ───────
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_roles: anyone can read"
ON admin_roles FOR SELECT
USING (true);

-- Ensure both roles exist
INSERT INTO admin_roles (name) VALUES ('system_admin') ON CONFLICT (name) DO NOTHING;
INSERT INTO admin_roles (name) VALUES ('police_admin')  ON CONFLICT (name) DO NOTHING;


-- ── 2. stations: Public read, admin-only write ────────
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stations: anyone can read"
ON stations FOR SELECT
USING (true);

CREATE POLICY "stations: system_admin can insert"
ON stations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "stations: system_admin can update"
ON stations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "stations: system_admin can delete"
ON stations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);


-- ── 3. profiles: Self read/update + admin reads all ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users read own"
ON profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "profiles: system_admin reads all"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "profiles: users update own"
ON profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "profiles: insert on signup"
ON profiles FOR INSERT
WITH CHECK (user_id = auth.uid());


-- ── 4. audit_logs: system_admin reads, any auth inserts
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: system_admin can read"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "audit_logs: authenticated can insert"
ON audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);


-- ── 5. notifications: Users manage their own ──────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: users read own"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "notifications: authenticated can insert"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications: users update own"
ON notifications FOR UPDATE
USING (user_id = auth.uid());


-- ── 6. verifications: police_admin (own station) + sysadmin
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications: system_admin reads all"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name = 'system_admin'
  )
);

CREATE POLICY "verifications: police_admin reads own station"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    JOIN reports r ON r.id = verifications.report_id
    WHERE p.user_id = auth.uid()
      AND ar.name = 'police_admin'
      AND p.station_id = r.station_id
  )
);

CREATE POLICY "verifications: police_admin or sysadmin inserts"
ON verifications FOR INSERT
WITH CHECK (
  admin_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_roles ar ON ar.id = p.role_id
    WHERE p.user_id = auth.uid() AND ar.name IN ('police_admin', 'system_admin')
  )
);
