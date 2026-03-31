-- ============================================================
-- FINAL SAAS INFRASTRUCTURE SYNC
-- Run this in your SQL Editor to ensure all modules are enabled
-- and SuperAdmin functions are correctly defined.
-- ============================================================

-- 1. Helper function for SuperAdmin checks (idempotent)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure all module columns exist in saas_plans
ALTER TABLE saas_plans 
  ADD COLUMN IF NOT EXISTS description           TEXT,
  ADD COLUMN IF NOT EXISTS module_whatsapp        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_multi_depot      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_livreurs         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_rapport_avance   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_white_label      BOOLEAN DEFAULT FALSE;

-- 3. Update plans with premium configurations (8 Modules Support)

-- FREE PLAN
UPDATE saas_plans SET
  name = 'Essentiel (Gratuit)',
  price_fcfa = 0,
  description = 'Le socle idéal pour lancer votre activité avec les outils de base.',
  is_popular = false,
  module_caisse = true,
  module_audit = false,
  module_api = false,
  module_whatsapp = false,
  module_multi_depot = false,
  module_livreurs = false,
  module_rapport_avance = false,
  module_white_label = false,
  color = '#94a3b8',
  icon_name = 'Zap'
WHERE id = 'FREE';

-- BASIC PLAN
UPDATE saas_plans SET
  name = 'Croissance',
  price_fcfa = 15000,
  description = 'Pour les entreprises en expansion nécessitant plus de flexibilité.',
  is_popular = true,
  module_caisse = true,
  module_audit = true,
  module_api = false,
  module_whatsapp = true,
  module_multi_depot = false,
  module_livreurs = true,
  module_rapport_avance = false,
  module_white_label = false,
  color = '#6366f1',
  icon_name = 'Rocket'
WHERE id = 'BASIC';

-- PREMIUM PLAN
UPDATE saas_plans SET
  name = 'Elite Professionnel',
  price_fcfa = 45000,
  description = 'Maîtrisez chaque aspect de votre chaîne logistique avec nos outils avancés.',
  is_popular = false,
  module_caisse = true,
  module_audit = true,
  module_api = true,
  module_whatsapp = true,
  module_multi_depot = true,
  module_livreurs = true,
  module_rapport_avance = true,
  module_white_label = false,
  color = '#8b5cf6',
  icon_name = 'Crown'
WHERE id = 'PREMIUM';

-- CUSTOM PLAN (ENTERPRISE / CUSTOM)
-- We check if CUSTOM exists, if not we use ENTERPRISE or create it
UPDATE saas_plans SET
  name = 'Sur-Mesure Enterprise',
  price_fcfa = -1, -- Contact us
  description = 'Solution dédiée 100% personnalisée sur votre propre infrastructure.',
  is_popular = false,
  module_caisse = true,
  module_audit = true,
  module_api = true,
  module_whatsapp = true,
  module_multi_depot = true,
  module_livreurs = true,
  module_rapport_avance = true,
  module_white_label = true,
  color = '#cbd5e1',
  icon_name = 'Settings'
WHERE id IN ('CUSTOM', 'ENTERPRISE');

-- 4. Re-create the update_saas_plan RPC to use our new is_superadmin() function
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT,
  p_name TEXT,
  p_price_fcfa BIGINT,
  p_description TEXT,
  p_is_popular BOOLEAN,
  p_module_caisse BOOLEAN,
  p_module_audit BOOLEAN,
  p_module_api BOOLEAN,
  p_module_whatsapp BOOLEAN DEFAULT FALSE,
  p_module_multi_depot BOOLEAN DEFAULT FALSE,
  p_module_livreurs BOOLEAN DEFAULT FALSE,
  p_module_rapport_avance BOOLEAN DEFAULT FALSE,
  p_module_white_label BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  -- Security check using our centralized function
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé: droits SuperAdmin requis');
  END IF;

  UPDATE saas_plans SET
    name                  = p_name,
    price_fcfa            = p_price_fcfa,
    description           = p_description,
    is_popular            = p_is_popular,
    module_caisse         = p_module_caisse,
    module_audit          = p_module_audit,
    module_api            = p_module_api,
    module_whatsapp       = COALESCE(p_module_whatsapp, FALSE),
    module_multi_depot    = COALESCE(p_module_multi_depot, FALSE),
    module_livreurs       = COALESCE(p_module_livreurs, FALSE),
    module_rapport_avance = COALESCE(p_module_rapport_avance, FALSE),
    module_white_label    = COALESCE(p_module_white_label, FALSE),
    updated_at            = now()
  WHERE id = p_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun plan trouvé avec cet identifiant: ' || p_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'rows_updated', v_rows_updated);
END;
$$;

-- 5. Final grants
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_saas_plan(TEXT, TEXT, BIGINT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;

-- Verify
SELECT id, name, price_fcfa, is_popular FROM saas_plans ORDER BY price_fcfa;
