-- SAAS MODULES EXTENSION: Support Tickets & Billing Logs

-- 1. Table for Support Tickets (Help Desk)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants_manage_own_tickets" ON support_tickets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "SuperAdmins_view_all_tickets" ON support_tickets FOR ALL TO authenticated USING (
    public.is_superadmin()
);


-- 2. Expand Subscriptions with explicit billing dates
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'ACTIVE';

-- 3. Table for Platform Audit Logs (SuperAdmin Actions)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins_view_audit_logs" ON admin_audit_logs FOR SELECT TO authenticated USING (
    public.is_superadmin()
);

