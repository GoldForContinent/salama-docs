-- ════════════════════════════════════════════════════════════════
-- SALAMA DOCS — RLS Policies (no recursion, safe to re-run)
-- Run the entire block in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── 0. Role-lookup helper (bypasses RLS via SECURITY DEFINER) ────
-- Prevents "infinite recursion detected in policy" errors when
-- policies on profiles need to check the caller's role.
CREATE OR REPLACE FUNCTION public.get_my_role_name()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ar.name
  FROM profiles p
  JOIN admin_roles ar ON ar.id = p.role_id
  WHERE p.user_id = auth.uid()
  LIMIT 1
$$;

-- ── 1. admin_roles: anyone can read ──────────────────────────
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_roles: anyone can read" ON admin_roles;
CREATE POLICY "admin_roles: anyone can read" ON admin_roles FOR SELECT USING (true);

INSERT INTO admin_roles (name) VALUES ('system_admin') ON CONFLICT (name) DO NOTHING;
INSERT INTO admin_roles (name) VALUES ('police_admin')  ON CONFLICT (name) DO NOTHING;

-- ── 2. stations: anyone can read, sysadmin can write ─────────
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stations: anyone can read" ON stations;
CREATE POLICY "stations: anyone can read" ON stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "stations: system_admin can insert" ON stations;
CREATE POLICY "stations: system_admin can insert" ON stations FOR INSERT
WITH CHECK (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "stations: system_admin can update" ON stations;
CREATE POLICY "stations: system_admin can update" ON stations FOR UPDATE
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "stations: system_admin can delete" ON stations;
CREATE POLICY "stations: system_admin can delete" ON stations FOR DELETE
USING (get_my_role_name() = 'system_admin');

-- ── 3. profiles: self read/update, sysadmin reads all ────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: users read own" ON profiles;
CREATE POLICY "profiles: users read own" ON profiles FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles: system_admin reads all" ON profiles;
CREATE POLICY "profiles: system_admin reads all" ON profiles FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "profiles: users update own" ON profiles;
CREATE POLICY "profiles: users update own" ON profiles FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles: insert on signup" ON profiles;
CREATE POLICY "profiles: insert on signup" ON profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles: system_admin updates all" ON profiles;
CREATE POLICY "profiles: system_admin updates all" ON profiles FOR UPDATE
USING (get_my_role_name() = 'system_admin');

-- ── 4. reports: users own, police_admin station, sysadmin all ─
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports: users read own" ON reports;
CREATE POLICY "reports: users read own" ON reports FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reports: system_admin reads all" ON reports;
CREATE POLICY "reports: system_admin reads all" ON reports FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "reports: police_admin reads own station" ON reports;
CREATE POLICY "reports: police_admin reads own station" ON reports FOR SELECT
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.station_id = reports.station_id
  )
);

DROP POLICY IF EXISTS "reports: authenticated can insert" ON reports;
CREATE POLICY "reports: authenticated can insert" ON reports FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reports: users update own" ON reports;
CREATE POLICY "reports: users update own" ON reports FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reports: police_admin updates own station" ON reports;
CREATE POLICY "reports: police_admin updates own station" ON reports FOR UPDATE
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.station_id = reports.station_id
  )
);

DROP POLICY IF EXISTS "reports: system_admin updates all" ON reports;
CREATE POLICY "reports: system_admin updates all" ON reports FOR UPDATE
USING (get_my_role_name() = 'system_admin');

-- ── 5. report_documents: inherits from reports ────────────────
ALTER TABLE report_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_documents: users read own" ON report_documents;
CREATE POLICY "report_documents: users read own" ON report_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = report_documents.report_id
    AND (reports.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "report_documents: system_admin reads all" ON report_documents;
CREATE POLICY "report_documents: system_admin reads all" ON report_documents FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "report_documents: police_admin reads own station" ON report_documents;
CREATE POLICY "report_documents: police_admin reads own station" ON report_documents FOR SELECT
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN reports r ON r.id = report_documents.report_id
    WHERE p.user_id = auth.uid() AND p.station_id = r.station_id
  )
);

DROP POLICY IF EXISTS "report_documents: authenticated can insert" ON report_documents;
CREATE POLICY "report_documents: authenticated can insert" ON report_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = report_documents.report_id
    AND reports.user_id = auth.uid()
  )
);

-- ── 6. finder_info: inherits from reports ────────────────────
ALTER TABLE finder_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finder_info: users read own" ON finder_info;
CREATE POLICY "finder_info: users read own" ON finder_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = finder_info.report_id
    AND (reports.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "finder_info: system_admin reads all" ON finder_info;
CREATE POLICY "finder_info: system_admin reads all" ON finder_info FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "finder_info: police_admin reads own station" ON finder_info;
CREATE POLICY "finder_info: police_admin reads own station" ON finder_info FOR SELECT
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN reports r ON r.id = finder_info.report_id
    WHERE p.user_id = auth.uid() AND p.station_id = r.station_id
  )
);

DROP POLICY IF EXISTS "finder_info: authenticated can insert" ON finder_info;
CREATE POLICY "finder_info: authenticated can insert" ON finder_info FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = finder_info.report_id
    AND reports.user_id = auth.uid()
  )
);

-- ── 7. recovered_reports: users see own, admins see relevant ─
ALTER TABLE recovered_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recovered_reports: users read own" ON recovered_reports;
CREATE POLICY "recovered_reports: users read own" ON recovered_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE (reports.id = recovered_reports.lost_report_id OR reports.id = recovered_reports.found_report_id)
    AND (reports.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "recovered_reports: system_admin reads all" ON recovered_reports;
CREATE POLICY "recovered_reports: system_admin reads all" ON recovered_reports FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "recovered_reports: police_admin reads own station" ON recovered_reports;
CREATE POLICY "recovered_reports: police_admin reads own station" ON recovered_reports FOR SELECT
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN reports r ON r.id = recovered_reports.found_report_id
    WHERE p.user_id = auth.uid() AND p.station_id = r.station_id
  )
);

DROP POLICY IF EXISTS "recovered_reports: authenticated can insert" ON recovered_reports;
CREATE POLICY "recovered_reports: authenticated can insert" ON recovered_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "recovered_reports: users can update own related" ON recovered_reports;
CREATE POLICY "recovered_reports: users can update own related" ON recovered_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE (reports.id = recovered_reports.lost_report_id OR reports.id = recovered_reports.found_report_id)
      AND reports.user_id = auth.uid()
  )
);

-- ── 8. transactions: users see own, admins see relevant ──────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions: users read own" ON transactions;
CREATE POLICY "transactions: users read own" ON transactions FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = transactions.report_id
    AND reports.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "transactions: system_admin reads all" ON transactions;
CREATE POLICY "transactions: system_admin reads all" ON transactions FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "transactions: authenticated can insert" ON transactions;
CREATE POLICY "transactions: authenticated can insert" ON transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "transactions: users update own" ON transactions;

DROP POLICY IF EXISTS "transactions: system_admin updates all" ON transactions;
CREATE POLICY "transactions: system_admin updates all" ON transactions FOR UPDATE
USING (get_my_role_name() = 'system_admin');

-- ── 9. audit_logs: sysadmin reads, any authenticated inserts ─
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs: system_admin can read" ON audit_logs;
CREATE POLICY "audit_logs: system_admin can read" ON audit_logs FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "audit_logs: authenticated can insert" ON audit_logs;
CREATE POLICY "audit_logs: authenticated can insert" ON audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ── 10. notifications: users manage own ─────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: users read own" ON notifications;
CREATE POLICY "notifications: users read own" ON notifications FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications: authenticated can insert" ON notifications;
CREATE POLICY "notifications: authenticated can insert" ON notifications FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications: users update own" ON notifications;
CREATE POLICY "notifications: users update own" ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- ── 11. verifications: police_admin (own station) + sysadmin ─
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verifications: system_admin reads all" ON verifications;
CREATE POLICY "verifications: system_admin reads all" ON verifications FOR SELECT
USING (get_my_role_name() = 'system_admin');

DROP POLICY IF EXISTS "verifications: police_admin reads own station" ON verifications;
CREATE POLICY "verifications: police_admin reads own station" ON verifications FOR SELECT
USING (
  get_my_role_name() = 'police_admin'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN reports r ON r.id = verifications.report_id
    WHERE p.user_id = auth.uid() AND p.station_id = r.station_id
  )
);

DROP POLICY IF EXISTS "verifications: police_admin or sysadmin inserts" ON verifications;
CREATE POLICY "verifications: police_admin or sysadmin inserts" ON verifications FOR INSERT
WITH CHECK (
  admin_id = auth.uid()
  AND get_my_role_name() IN ('police_admin', 'system_admin')
);

-- ── 12. locker_documents: users manage own ──────────────────
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locker_documents: users read own" ON locker_documents;
CREATE POLICY "locker_documents: users read own" ON locker_documents FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "locker_documents: users insert own" ON locker_documents;
CREATE POLICY "locker_documents: users insert own" ON locker_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "locker_documents: users update own" ON locker_documents;
CREATE POLICY "locker_documents: users update own" ON locker_documents FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "locker_documents: users delete own" ON locker_documents;
CREATE POLICY "locker_documents: users delete own" ON locker_documents FOR DELETE
USING (user_id = auth.uid());
