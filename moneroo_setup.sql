-- 0. Enable UUID extension if not already done
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table for tracking all Moneroo transactions
CREATE TABLE IF NOT EXISTS moneroo_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Ou gen_random_uuid() sur Postgres 13+
    tenant_id UUID REFERENCES tenants(id),
    reference_id TEXT, -- ID of the plan or subscription attempt
    type_transaction TEXT CHECK (type_transaction IN ('SUBSCRIPTION', 'ORDER')),
    moneroo_id TEXT UNIQUE, -- ID retourné par Moneroo (ex: p_...)
    montant NUMERIC(15, 2) NOT NULL,
    devise TEXT DEFAULT 'XOF',
    statut TEXT DEFAULT 'pending', -- pending, success, failed, expired
    checkout_url TEXT,
    customer_email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE moneroo_transactions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can see their own transactions
CREATE POLICY "Users can view their own transactions" ON moneroo_transactions
    FOR SELECT TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- SuperAdmins can see everything
CREATE POLICY "SuperAdmins can view all transactions" ON moneroo_transactions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- 4. Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_moneroo_transactions_updated_at
    BEFORE UPDATE ON moneroo_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 5. Helper function to process successful subscription payment (can be called via RPC or Trigger)
CREATE OR REPLACE FUNCTION process_subscription_payment(t_id TEXT, p_plan TEXT)
RETURNS VOID AS $$
BEGIN
    -- Update Tenant Status
    UPDATE tenants SET plan = p_plan, actif = true WHERE id = t_id::UUID;
    
    -- Update or Insert Subscription
    INSERT INTO subscriptions (tenant_id, plan, status, current_period_start, current_period_end)
    VALUES (
        t_id::UUID, 
        p_plan, 
        'active', 
        now(), 
        now() + interval '1 month'
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        plan = p_plan,
        status = 'active',
        current_period_end = subscriptions.current_period_end + interval '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
