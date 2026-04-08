
-- ============================================================
-- EMERGENCY INFRASTRUCTURE REBUILD & MULTI-TENANT STABILIZATION
-- This script fixes missing tables, columns, and RLS policies.
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES & COLUMNS REPAIR
-- Ensure zones_livraison exists and has tenant_id
CREATE TABLE IF NOT EXISTS public.zones_livraison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    frais INTEGER DEFAULT 0,
    delai_estime TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id)
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zones_livraison' AND column_name='tenant_id') THEN
        ALTER TABLE public.zones_livraison ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Ensure livreurs table exists (often confused with users)
CREATE TABLE IF NOT EXISTS public.livreurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    zone_id UUID REFERENCES public.zones_livraison(id),
    statut TEXT DEFAULT 'disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id)
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='livreurs' AND column_name='tenant_id') THEN
        ALTER TABLE public.livreurs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 3. VIEWS REPAIR
-- Creating staff_performance_summary as a robust updatable-like view or just a plain view
DROP VIEW IF EXISTS public.staff_performance_summary CASCADE;
CREATE OR REPLACE VIEW public.staff_performance_summary AS
SELECT 
    u.id as staff_id,
    u.nom_complet as staff_name,
    u.tenant_id,
    u.role,
    COUNT(c.id) filter (where c.id is not null) as total_commandes,
    COUNT(c.id) filter (where c.statut_commande = 'livree') as total_livrees,
    COUNT(c.id) filter (where c.statut_commande = 'echouee') as total_echouees,
    SUM(COALESCE(c.montant_encaisse, 0)) as total_encaisse
FROM public.users u
LEFT JOIN public.commandes c ON c.livreur_id = u.id
GROUP BY u.id, u.nom_complet, u.tenant_id, u.role;

-- 4. ROW LEVEL SECURITY (RLS) ENFORCEMENT
-- Turn on RLS for everything important
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_route ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Idempotent: Drop then Create)

-- Helper: Drop existing policies before creating new ones
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Tenant Isolation Policies (Global Pattern)
-- Note: Super Admin can see everything. Others only their tenant.

-- USERS
CREATE POLICY "Tenant isolation for users" ON public.users 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- COMMANDES
CREATE POLICY "Tenant isolation for commandes" ON public.commandes 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- PRODUITS
CREATE POLICY "Tenant isolation for produits" ON public.produits 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- CLIENTS
CREATE POLICY "Tenant isolation for clients" ON public.clients 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- COMMUNES
CREATE POLICY "Tenant isolation for communes" ON public.communes 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- ZONES_LIVRAISON
CREATE POLICY "Tenant isolation for zones_livraison" ON public.zones_livraison 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- LIVREURS
CREATE POLICY "Tenant isolation for livreurs" ON public.livreurs 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- FEUILLES_ROUTE
CREATE POLICY "Tenant isolation for feuilles_route" ON public.feuilles_route 
USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- 6. CACHE RELOAD
NOTIFY pgrst, 'reload schema';

-- 7. GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Final sync of saas_plans modules
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS module_livreurs BOOLEAN DEFAULT true;
UPDATE saas_plans SET module_livreurs = true;

-- Ensure JacheteCi has all modules
UPDATE tenants SET plan = 'PREMIUM' WHERE id = 'ef16e4fe-a3d6-4b38-8cea-d618b002063a';
