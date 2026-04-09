-- Ensure update_tenant_plan RPC exists
CREATE OR REPLACE FUNCTION update_tenant_plan(
  t_id TEXT,
  new_plan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  UPDATE tenants SET 
    plan = new_plan,
    updated_at = now()
  WHERE id = t_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION update_tenant_plan(TEXT, TEXT) TO authenticated;
