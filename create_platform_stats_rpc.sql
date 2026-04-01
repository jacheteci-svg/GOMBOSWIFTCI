-- RPC pour récupérer les vraies statistiques de la plateforme GomboSwiftCI (SaaS)

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json AS $$
DECLARE
  v_total_tenants INT;
  v_active_tenants INT;
  v_total_users INT;
  v_total_orders INT;
  v_total_revenue NUMERIC;
  v_saas_revenue NUMERIC;
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur est SuperAdmin
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Accès refusé. Seul un SuperAdmin peut voir ces statistiques.';
  END IF;

  -- 1. Nombre total d'organisations
  SELECT count(*) INTO v_total_tenants FROM tenants;

  -- 2. Nombre d'organisations actives
  SELECT count(*) INTO v_active_tenants FROM tenants WHERE actif = true;

  -- 3. Nombre total d'utilisateurs sur la plateforme
  SELECT count(*) INTO v_total_users FROM users;

  -- 4. Nombre total de commandes livrées (en tant qu'indicateur de trafic clients)
  SELECT count(*) INTO v_total_orders FROM commandes WHERE statut_commande = 'livree';

  -- 5. Revenu cumulé des TENANTS (GMV - Volume d'affaires brut)
  SELECT COALESCE(sum(montant_total), 0) INTO v_total_revenue FROM commandes WHERE statut_commande = 'livree';

  -- 6. Revenu réel de la PLATEFORME (SaaS Fees / Subscriptions)
  -- On somme les transactions Moneroo réussies
  SELECT COALESCE(sum(montant), 0) INTO v_saas_revenue FROM moneroo_transactions WHERE statut = 'success';

  -- Construire l'objet JSON
  v_result := json_build_object(
    'total_tenants', COALESCE(v_total_tenants, 0),
    'active_tenants', COALESCE(v_active_tenants, 0),
    'total_users', COALESCE(v_total_users, 0),
    'total_orders', COALESCE(v_total_orders, 0),
    'total_revenue', COALESCE(v_saas_revenue, 0), -- Pour l'admin, le revenu 'global' est son CA SaaS
    'tenant_gmv', COALESCE(v_total_revenue, 0)   -- On garde le volume client en bonus
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
