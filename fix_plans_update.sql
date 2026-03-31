-- ============================================================
-- FIX: Plans Update RLS + Secure RPC Function
-- Exécutez ce script dans votre éditeur SQL InsForge/Supabase
-- ============================================================

-- 1. S'assurer que RLS est activé sur saas_plans
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "SuperAdmins_manage_plans" ON saas_plans;
DROP POLICY IF EXISTS "Public_read_plans" ON saas_plans;
DROP POLICY IF EXISTS "Anyone_read_plans" ON saas_plans;

-- 3. Policy: tout le monde peut LIRE les plans (landing page publique)
CREATE POLICY "Public_read_plans" ON saas_plans
  FOR SELECT USING (true);

-- 4. Policy: seuls les superadmins peuvent modifier les plans
CREATE POLICY "SuperAdmins_manage_plans" ON saas_plans
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 5. Créer une fonction RPC SECURITY DEFINER pour les mises à jour SuperAdmin
--    Cette fonction s'exécute avec les droits du créateur (bypass RLS)
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
  v_result JSONB;
BEGIN
  -- Vérifier que l'appelant est un superadmin
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

-- 6. Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 7. Ajouter les colonnes modules manquantes (idempotent)
ALTER TABLE saas_plans
  ADD COLUMN IF NOT EXISTS module_whatsapp       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_multi_depot     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_livreurs        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_rapport_avance  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_white_label     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS description            TEXT;

-- 8. Vérification: test de lecture
SELECT id, name, price_fcfa, is_popular,
  module_caisse, module_audit, module_api,
  module_whatsapp, module_multi_depot, module_livreurs,
  module_rapport_avance, module_white_label
FROM saas_plans
ORDER BY price_fcfa;
