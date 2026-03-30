-- SUPERADMIN PROFILE FIX - Run this in your SQL Editor
-- This fixes the SUPER_ADMIN login redirect issue by bypassing RLS for profile fetch

-- 1. Function to get own profile (SECURITY DEFINER bypasses RLS entirely)
CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS JSON AS $$
  SELECT row_to_json(u)
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_own_profile() TO authenticated;

-- 2. Ensure SUPER_ADMIN can INSERT their own profile (upsert-friendly policy)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Ensure SUPER_ADMIN can SELECT their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 4. Verify the function works
SELECT get_own_profile();
