-- Optionnel : si vous souhaitez stocker les remarques sur la fiche client (PostgREST / schéma cache).
-- À exécuter une fois sur la base InsForge / Postgres du projet.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS remarques TEXT;
