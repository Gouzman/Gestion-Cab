-- ============================================================
-- Migration : Ajouter document_category à tasks_files
-- ============================================================
-- Ce script s'assure que la colonne document_category existe
-- dans tasks_files pour stocker les catégories de documents
-- ============================================================

-- 1️⃣ Ajouter la colonne document_category si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks_files' 
    AND column_name = 'document_category'
  ) THEN
    ALTER TABLE public.tasks_files 
    ADD COLUMN document_category text;
    
    RAISE NOTICE '✅ Colonne document_category ajoutée à tasks_files';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne document_category existe déjà';
  END IF;
END $$;

-- 2️⃣ Créer un index pour améliorer les performances des filtres par catégorie
CREATE INDEX IF NOT EXISTS idx_tasks_files_document_category ON public.tasks_files(document_category);

-- 3️⃣ Vérification
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks_files'
  AND column_name = 'document_category';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration document_category terminée !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Colonne document_category disponible dans tasks_files';
  RAISE NOTICE '📋 Index idx_tasks_files_document_category créé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Catégories disponibles :';
  RAISE NOTICE '   • Documents de suivi et facturation';
  RAISE NOTICE '   • Pièces';
  RAISE NOTICE '   • Écritures';
  RAISE NOTICE '   • Courriers';
  RAISE NOTICE '   • Observations et notes';
  RAISE NOTICE '';
END $$;
