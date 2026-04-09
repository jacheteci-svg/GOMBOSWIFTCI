-- ============================================================
-- SUPERADMIN MANUAL BILLING OVERRIDE v2.0
-- Allows granular control over tenant plans and expiration
-- ============================================================

CREATE OR REPLACE FUNCTION update_tenant_plan_manual(
  p_tenant_id UUID,
  p_plan_id TEXT,
  p_status TEXT DEFAULT 'paid',
  p_next_billing TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_record RECORD;
BEGIN
  -- 1. Security Check
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  -- 2. Validate Plan
  SELECT * INTO v_plan_record FROM saas_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan non trouvé: ' || p_plan_id);
  END IF;

  -- 3. Update Tenant
  UPDATE tenants SET
    plan = p_plan_id,
    plan_id = p_plan_id,
    billing_status = p_status,
    next_billing_at = COALESCE(p_next_billing, now() + interval '1 month'),
    updated_at = now()
  WHERE id = p_tenant_id;

  -- 4. Log the manual adjustment
  INSERT INTO admin_audit_logs (action, details)
  VALUES ('MANUAL_PLAN_OVERRIDE', jsonb_build_object(
    'tenant_id', p_tenant_id,
    'new_plan', p_plan_id,
    'status', p_status,
    'next_billing', p_next_billing
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION update_tenant_plan_manual(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
