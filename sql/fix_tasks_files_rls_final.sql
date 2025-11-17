-- ============================================================
-- CORRECTION FINALE : Policies RLS pour tasks_files
-- ============================================================
-- Ce script corrige l'erreur :
-- "new row violates row-level security policy for table tasks_files"
--
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ÉTAPE 1 : Vérifier que la table existe et activer RLS
-- ============================================================
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer TOUTES les anciennes policies
-- ============================================================
-- Supprimer toutes les policies existantes pour éviter les conflits
DROP POLICY IF EXISTS "tasks_files_select_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_insert_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_update_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_delete_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "read_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "insert_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "update_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "delete_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_select" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_insert" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_update" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_delete" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_all" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_select" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_insert" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_update" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_delete" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow insert for creators" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow delete for creators" ON public.tasks_files;

-- ÉTAPE 3 : Créer les nouvelles policies RLS minimales
-- ============================================================

-- Policy SELECT : Tous les utilisateurs authentifiés peuvent lire tous les fichiers
CREATE POLICY "Allow select for authenticated users"
  ON public.tasks_files
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy INSERT : Les utilisateurs authentifiés peuvent insérer des fichiers
-- La colonne created_by sera automatiquement remplie par auth.uid()
CREATE POLICY "Allow insert for creators"
  ON public.tasks_files
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Policy DELETE : Seul le créateur peut supprimer ses fichiers
CREATE POLICY "Allow delete for creators"
  ON public.tasks_files
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ÉTAPE 4 : Vérification des policies créées
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'USING: (none)'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'WITH CHECK: (none)'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'tasks_files'
ORDER BY cmd;

-- ÉTAPE 5 : Vérifier que la colonne created_by existe
-- ============================================================
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks_files'
  AND column_name = 'created_by';

-- ÉTAPE 6 : Confirmation
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Policies RLS pour tasks_files créées !';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies actives :';
  RAISE NOTICE '   • SELECT : Tous les utilisateurs authentifiés';
  RAISE NOTICE '   • INSERT : Créateurs uniquement (created_by = auth.uid())';
  RAISE NOTICE '   • DELETE : Créateurs uniquement';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérifiez les résultats ci-dessus pour confirmer.';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 L''insertion dans tasks_files devrait maintenant fonctionner !';
  RAISE NOTICE '';
END $$;
