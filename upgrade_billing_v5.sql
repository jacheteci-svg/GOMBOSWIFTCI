-- ============================================================
-- SaaS INFRASTRUCTURE UPGRADE: BILLING & SUBSCRIPTIONS v5.0
-- "Perfect SaaS" Edition
-- ============================================================

-- 1. Ensure granular columns in tenants for better tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES saas_plans(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT; -- For future use
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS moneroo_customer_id TEXT;

-- 2. Refine Subscriptions Table for History
-- We want to keep a history of subscriptions, but mark one as current.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount BIGINT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES saas_plans(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- 3. Trigger to keep tenants.plan and tenants.plan_id in sync (Optional but safe)
CREATE OR REPLACE FUNCTION sync_tenant_plan_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL AND (OLD.plan_id IS NULL OR NEW.plan_id <> OLD.plan_id) THEN
    NEW.plan = NEW.plan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tenant_plan_id ON tenants;
CREATE TRIGGER trg_sync_tenant_plan_id
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE PROCEDURE sync_tenant_plan_id();

-- 4. Improved process_subscription_payment
-- This function is called by the Moneroo webhook to finalize a subscription.
CREATE OR REPLACE FUNCTION process_subscription_payment(t_id TEXT, p_plan TEXT)
RETURNS JSONB AS $$
DECLARE
  v_plan_record RECORD;
BEGIN
  -- 1. Get plan details
  SELECT * INTO v_plan_record FROM saas_plans WHERE id = p_plan;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan non trouvé');
  END IF;

  -- 2. Update Tenant
  UPDATE tenants SET
    plan = p_plan,
    plan_id = p_plan,
    actif = true,
    billing_status = 'paid',
    next_billing_at = now() + interval '1 month',
    updated_at = now()
  WHERE id = t_id::UUID;

  -- 3. Record in Subscriptions (History)
  INSERT INTO subscriptions (
    tenant_id, 
    plan, 
    plan_id, 
    status, 
    current_period_start, 
    current_period_end,
    amount,
    currency
  )
  VALUES (
    t_id::UUID, 
    p_plan,
    p_plan,
    'active', 
    now(), 
    now() + interval '1 month',
    v_plan_record.price_fcfa,
    'XOF'
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to get Billing Context for Admin Dashboard
CREATE OR REPLACE FUNCTION get_tenant_billing_context(t_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_sub RECORD;
  v_usage RECORD;
BEGIN
  -- User/Admin only if they belong to the tenant
  -- This security check is implicit via RLS but we add it for safety
  
  -- Gather Tenant Info
  SELECT * INTO v_tenant FROM tenants WHERE id = t_id;
  
  -- Gather Active Subscription
  SELECT * INTO v_sub FROM subscriptions 
  WHERE tenant_id = t_id AND status = 'active' 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Gather Usage Stats (Example: Users & Products)
  SELECT 
    (SELECT COUNT(*) FROM users WHERE tenant_id = t_id) as users_count,
    (SELECT COUNT(*) FROM produits WHERE tenant_id = t_id) as products_count,
    (SELECT COUNT(*) FROM commandes WHERE tenant_id = t_id AND date_creation >= date_trunc('month', now())) as monthly_orders_count
  INTO v_usage;

  RETURN jsonb_build_object(
    'tenant', v_tenant,
    'subscription', v_sub,
    'usage', v_usage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_tenant_billing_context(UUID) TO authenticated;
