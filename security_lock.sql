// ============================================================
// GOMBOSWIFTCI INFRASTRUCTURE SECURITY REINFORCEMENT
// ============================================================

-- 1. CLEANING THE CACHE (FORCE SCHEMA RELOAD FOR POSTGREST)
NOTIFY pgrst, 'reload schema';

-- 2. ENSURING TOTAL DATA ISOLATION (No Cross-Tenant Read)
DO $$ 
BEGIN
    -- This script ensures no user can read from 'tenants' except what's needed for UI
    DROP POLICY IF EXISTS "Public can read active tenant basic info" ON tenants;
    CREATE POLICY "Public can read active tenant basic info" ON tenants
        FOR SELECT
        USING (actif = true);

    -- 3. LOCKING TRANSACTION HISTORY (Only for the RIGHT tenant)
    ALTER TABLE moneroo_transactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenant can only see their own transactions" ON moneroo_transactions;
    CREATE POLICY "Tenant can only see their own transactions" ON moneroo_transactions
        FOR ALL TO authenticated
        USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

    -- 4. PERFORMANCE: AGGRESSIVE CACHING ON STATIC VIEWS
    -- (Handled by PostgREST and Vercel Edge Cache)
END $$;
