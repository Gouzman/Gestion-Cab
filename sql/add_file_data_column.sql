-- ============================================================
-- Ajout de la colonne file_data pour backup local des fichiers
-- ============================================================
-- Ce script ajoute la colonne file_data à la table tasks_files
-- pour permettre le stockage de fichiers < 1Mo directement en base
-- 
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ✅ Étape 1 : Ajouter la colonne file_data (BYTEA pour données binaires)
ALTER TABLE public.tasks_files
ADD COLUMN IF NOT EXISTS file_data BYTEA NULL;

-- ✅ Étape 2 : Ajouter un commentaire explicatif
COMMENT ON COLUMN public.tasks_files.file_data IS 'Backup local des fichiers < 1Mo pour résilience (BYTEA)';

-- ✅ Étape 3 : Créer un index partiel pour optimiser les requêtes
-- (uniquement sur les lignes où file_data est non NULL)
CREATE INDEX IF NOT EXISTS idx_tasks_files_has_backup 
  ON public.tasks_files(task_id) 
  WHERE file_data IS NOT NULL;

-- ✅ Étape 4 : Rafraîchir le cache du schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- ✅ Étape 5 : Vérification
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks_files'
  AND column_name = 'file_data';

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Colonne file_data ajoutée avec succès !';
  RAISE NOTICE '✅ Index créé pour optimiser les requêtes';
  RAISE NOTICE '✅ Cache PostgREST rechargé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Les fichiers < 1Mo seront désormais sauvegardés avec backup local.';
  RAISE NOTICE '🎯 En cas d''URL invalide, le système utilisera automatiquement le backup.';
END $$;
