-- ============================================================
-- CORRECTION IMMÉDIATE : Policies RLS pour tasks_files
-- ============================================================
-- Ce script corrige l'erreur 42501: "new row violates row-level security policy"
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Vérifier que la table existe et que RLS est activé
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les anciennes policies qui pourraient être restrictives
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

-- 3. Créer les nouvelles policies permissives
-- Ces policies autorisent tous les utilisateurs authentifiés (avec JWT valide)

CREATE POLICY "tasks_files_allow_all_select"
  ON public.tasks_files
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_files_allow_all_insert"
  ON public.tasks_files
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_files_allow_all_update"
  ON public.tasks_files
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_files_allow_all_delete"
  ON public.tasks_files
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. Vérifier que les policies ont été créées correctement
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

-- 5. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS pour tasks_files mises à jour avec succès !';
  RAISE NOTICE '✅ Les utilisateurs authentifiés peuvent maintenant insérer, lire, modifier et supprimer des fichiers.';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérifiez les policies ci-dessus pour confirmer la configuration.';
END $$;
