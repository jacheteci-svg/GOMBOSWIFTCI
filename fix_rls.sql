-- Fix RLS for tenant creation
DROP POLICY IF EXISTS tenant_insert_public ON tenants;
CREATE POLICY tenant_insert_public ON tenants 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

GRANT INSERT ON tenants TO anon, authenticated;

-- Ensure users can also be created for the new tenant
DROP POLICY IF EXISTS user_insert_public ON users;
CREATE POLICY user_insert_public ON users 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

GRANT INSERT ON users TO anon, authenticated;
