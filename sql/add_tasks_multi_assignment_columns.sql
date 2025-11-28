-- ============================================
-- Ajout des colonnes pour multi-assignation et visibilité
-- Table : tasks
-- Date : 27 novembre 2025
-- ============================================

-- 1️⃣ Ajout de la colonne assigned_to_ids
-- Permet d'assigner une tâche à plusieurs collaborateurs
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_to_ids UUID[] DEFAULT '{}';

-- 2️⃣ Ajout de la colonne visible_by_ids
-- Liste des utilisateurs autorisés à consulter la tâche
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS visible_by_ids UUID[] DEFAULT '{}';

-- 3️⃣ Ajout des colonnes de noms (si pas déjà présentes)
-- Colonnes complémentaires pour affichage rapide sans JOIN
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 4️⃣ Activation du Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Commentaires sur les colonnes
-- ============================================

COMMENT ON COLUMN tasks.assigned_to_ids IS 'Tableau d''UUIDs des collaborateurs assignés (multi-assignation)';
COMMENT ON COLUMN tasks.visible_by_ids IS 'Tableau d''UUIDs des utilisateurs autorisés à voir la tâche';
COMMENT ON COLUMN tasks.assigned_to_name IS 'Nom du collaborateur principal assigné (denormalisé pour performance)';
COMMENT ON COLUMN tasks.created_by_name IS 'Nom du créateur de la tâche (denormalisé pour performance)';

-- ============================================
-- Vérification
-- ============================================

-- Pour vérifier que les colonnes ont été ajoutées :
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' 
-- AND column_name IN ('assigned_to_ids', 'visible_by_ids', 'assigned_to_name', 'created_by_name');
