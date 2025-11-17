-- =====================================================
-- Script: Ajout de la contrainte de clé étrangère
-- Table: tasks_files -> tasks
-- Description: Garantit l'intégrité référentielle et permet
--              les jointures tasks!inner(...) dans Supabase
-- Date: 2025-11-11
-- =====================================================

-- Vérifier si la contrainte existe déjà
DO $$ 
BEGIN
    -- Si la contrainte n'existe pas, l'ajouter
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_files_task' 
        AND table_name = 'tasks_files'
    ) THEN
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE tasks_files
        ADD CONSTRAINT fk_task_files_task
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Contrainte fk_task_files_task créée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ Contrainte fk_task_files_task existe déjà';
    END IF;
END $$;

-- Vérifier que la contrainte est bien en place
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tasks_files'
    AND tc.constraint_name = 'fk_task_files_task';

-- =====================================================
-- NOTES:
-- 
-- 1. Cette contrainte assure que:
--    - Chaque task_id dans tasks_files existe dans tasks
--    - La suppression d'une tâche supprime automatiquement
--      ses fichiers associés (CASCADE)
-- 
-- 2. Avantages:
--    - Permet les jointures tasks!inner(...) dans Supabase
--    - Garantit l'intégrité des données
--    - Évite les erreurs 404 et PGRST301
-- 
-- 3. À exécuter dans: Supabase Dashboard > SQL Editor
-- =====================================================
