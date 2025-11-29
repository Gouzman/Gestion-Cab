-- ============================================================
-- Migration : Ajouter case_id à tasks_files
-- ============================================================
-- Ce script ajoute une colonne case_id optionnelle pour permettre
-- de lier des documents directement à un dossier (case) sans tâche
-- ============================================================

-- 1️⃣ Ajouter la colonne case_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks_files' 
    AND column_name = 'case_id'
  ) THEN
    ALTER TABLE public.tasks_files 
    ADD COLUMN case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Colonne case_id ajoutée à tasks_files';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne case_id existe déjà';
  END IF;
END $$;

-- 2️⃣ Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_files_case_id ON public.tasks_files(case_id);

-- 3️⃣ Modifier la contrainte de task_id pour être optionnelle
ALTER TABLE public.tasks_files 
ALTER COLUMN task_id DROP NOT NULL;

-- 4️⃣ Ajouter une contrainte CHECK pour s'assurer qu'au moins un lien existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_files_check_link'
  ) THEN
    ALTER TABLE public.tasks_files 
    ADD CONSTRAINT tasks_files_check_link 
    CHECK (task_id IS NOT NULL OR case_id IS NOT NULL);
    
    RAISE NOTICE '✅ Contrainte CHECK ajoutée : au moins task_id ou case_id requis';
  END IF;
END $$;

-- 5️⃣ Vérification
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks_files'
  AND column_name IN ('task_id', 'case_id')
ORDER BY ordinal_position;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Structure tasks_files mise à jour :';
  RAISE NOTICE '   • task_id : UUID optionnel (lien vers tasks)';
  RAISE NOTICE '   • case_id : UUID optionnel (lien vers cases)';
  RAISE NOTICE '   • Contrainte : Au moins l''un des deux doit être rempli';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Vous pouvez maintenant :';
  RAISE NOTICE '   1. Lier des fichiers à une tâche spécifique (task_id)';
  RAISE NOTICE '   2. Lier des fichiers à un dossier général (case_id)';
  RAISE NOTICE '   3. Lier des fichiers aux deux (task_id + case_id)';
  RAISE NOTICE '';
END $$;
