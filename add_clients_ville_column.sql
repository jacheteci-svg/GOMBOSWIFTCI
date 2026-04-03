-- Optionnel : si vous souhaitez stocker la ville sur la fiche client (PostgREST / schéma cache).
-- À exécuter une fois sur la base InsForge / Postgres du projet.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS ville TEXT;
