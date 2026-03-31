-- ============================================================
-- MIGRATION: Add 5 new module columns to saas_plans
-- So there are 8 total lockable/unlockable modules per plan
-- Run this in your InsForge/Supabase SQL editor
-- ============================================================

-- Add 5 new module columns (the 3 existing ones: module_caisse, module_audit, module_api)
ALTER TABLE saas_plans
  ADD COLUMN IF NOT EXISTS module_whatsapp       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_multi_depot     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_livreurs        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_rapport_avance  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_white_label     BOOLEAN DEFAULT FALSE;

-- Also add description column if not present
ALTER TABLE saas_plans
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Set sensible defaults for existing plans
-- FREE plan: no extra modules
UPDATE saas_plans SET
  module_whatsapp = FALSE,
  module_multi_depot = FALSE,
  module_livreurs = FALSE,
  module_rapport_avance = FALSE,
  module_white_label = FALSE,
  description = 'Parfait pour débuter votre activité logistique.'
WHERE id = 'FREE';

-- BASIC plan: WhatsApp + Livreurs
UPDATE saas_plans SET
  module_whatsapp = TRUE,
  module_multi_depot = FALSE,
  module_livreurs = TRUE,
  module_rapport_avance = FALSE,
  module_white_label = FALSE,
  description = 'Pour les boutiques en pleine expansion.'
WHERE id = 'BASIC';

-- PREMIUM plan: most modules
UPDATE saas_plans SET
  module_whatsapp = TRUE,
  module_multi_depot = TRUE,
  module_livreurs = TRUE,
  module_rapport_avance = TRUE,
  module_white_label = FALSE,
  description = 'La solution complète pour les pros de la logistique.'
WHERE id = 'PREMIUM';

-- CUSTOM plan: all modules
UPDATE saas_plans SET
  module_whatsapp = TRUE,
  module_multi_depot = TRUE,
  module_livreurs = TRUE,
  module_rapport_avance = TRUE,
  module_white_label = TRUE,
  description = 'Version unique, non-SaaS, personnalisée à 100% pour vos besoins.'
WHERE id = 'CUSTOM';

-- Verify
SELECT id, name, price_fcfa,
  module_caisse, module_audit, module_api,
  module_whatsapp, module_multi_depot, module_livreurs,
  module_rapport_avance, module_white_label
FROM saas_plans
ORDER BY price_fcfa;
