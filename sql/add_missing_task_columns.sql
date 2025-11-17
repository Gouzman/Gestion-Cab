-- Script SQL pour ajouter les colonnes manquantes à la table tasks
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne seen_at pour tracker quand une tâche a été vue par l'assigné
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- 2. Ajouter la colonne associated_tasks pour lier des tâches entre elles
-- Utilisation de TEXT[] pour stocker un array de tâches associées
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS associated_tasks TEXT[] DEFAULT '{}';

-- 3. Ajouter des commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN tasks.seen_at IS 'Timestamp indiquant quand la tâche a été vue par l''assigné';
COMMENT ON COLUMN tasks.associated_tasks IS 'Array des IDs des tâches associées à cette tâche';

-- 4. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tasks_seen_at 
ON tasks(seen_at) 
WHERE seen_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_associated_tasks 
ON tasks USING GIN(associated_tasks) 
WHERE array_length(associated_tasks, 1) > 0;

-- 5. Rafraîchir le cache du schéma pour éviter les erreurs PGRST204
-- Note: Cette commande peut nécessiter des privilèges administrateur
-- NOTIFY pgrst, 'reload schema';

-- 6. Vérifier que les colonnes ont été ajoutées correctement
-- Vous pouvez exécuter cette requête pour vérifier :
/*
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('seen_at', 'associated_tasks')
ORDER BY column_name;
*/

-- 7. Exemple de structure attendue de la table tasks après modification
-- La table tasks doit maintenant contenir au minimum :
-- - id (UUID, PRIMARY KEY)
-- - title (TEXT, NOT NULL)
-- - description (TEXT)
-- - priority (TEXT)
-- - status (TEXT)
-- - deadline (TIMESTAMPTZ)
-- - assigned_to_id (UUID, FOREIGN KEY)
-- - case_id (UUID, FOREIGN KEY)
-- - main_category (TEXT)
-- - seen_at (TIMESTAMPTZ) -- NOUVELLE COLONNE
-- - associated_tasks (TEXT[]) -- NOUVELLE COLONNE
-- - created_at (TIMESTAMPTZ, DEFAULT now())
-- - updated_at (TIMESTAMPTZ, DEFAULT now())
-- - created_by_id (UUID)
-- - created_by_name (TEXT)
-- - attachments (JSONB)

-- 8. Mise à jour des politiques RLS si nécessaire
-- Les politiques existantes devraient automatiquement s'appliquer aux nouvelles colonnes
-- Aucune modification RLS spécifique n'est nécessaire pour ces colonnes