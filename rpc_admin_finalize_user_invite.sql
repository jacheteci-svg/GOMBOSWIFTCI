-- À exécuter une fois sur la base Postgres InsForge (éditeur SQL du tableau de bord).
-- (Copie également incluse à la fin de « ensure_core_schema.sql » pour tout appliquer en un seul script.)
--
-- Pourquoi : après « Créer un profil », le SDK appelle signUp. Si la confirmation e-mail est
-- obligatoire, souvent il n’y a pas d’UUID exploitable côté navigateur : cette fonction lit
-- auth.users par e-mail et fait l’upsert dans public.users, en vérifiant que l’admin appelant
-- est du même tenant.
--
-- Alternative : dans InsForge → Auth / paramètres, désactiver la confirmation e-mail obligatoire
-- pour les inscriptions (développement ou équipe de confiance uniquement).

CREATE OR REPLACE FUNCTION public.admin_finalize_user_invite(
  p_email text,
  p_tenant_id uuid,
  p_nom_complet text,
  p_role text,
  p_telephone text,
  p_permissions text[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_tenant uuid;
  v_uid uuid;
BEGIN
  SELECT tenant_id INTO v_actor_tenant
  FROM public.users
  WHERE id = auth.uid();

  IF v_actor_tenant IS NULL OR v_actor_tenant <> p_tenant_id THEN
    RAISE EXCEPTION 'Accès refusé (tenant).';
  END IF;

  SELECT u.id INTO v_uid
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
  LIMIT 1;

  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.users (
    id, email, nom_complet, role, telephone, permissions, tenant_id, actif
  )
  VALUES (
    v_uid,
    lower(trim(p_email)),
    p_nom_complet,
    p_role,
    p_telephone,
    COALESCE(p_permissions, '{}'),
    p_tenant_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    nom_complet = EXCLUDED.nom_complet,
    role = EXCLUDED.role,
    telephone = EXCLUDED.telephone,
    permissions = EXCLUDED.permissions,
    tenant_id = EXCLUDED.tenant_id,
    actif = EXCLUDED.actif,
    email = EXCLUDED.email;

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_finalize_user_invite(text, uuid, text, text, text, text[]) TO authenticated;
