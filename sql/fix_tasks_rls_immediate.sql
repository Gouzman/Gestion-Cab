-- ============================================================
-- CORRECTION IMMÉDIATE : Policies RLS pour la table tasks
-- ============================================================
-- Erreur : "new row violates row-level security policy for table tasks"
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ÉTAPE 1 : Activer RLS sur la table tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
DROP POLICY IF EXISTS "read_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "insert_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "update_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "delete_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.tasks;

-- ÉTAPE 3 : Créer les nouvelles policies RLS pour tasks
-- Ces policies autorisent tous les utilisateurs authentifiés

-- SELECT : Tous les utilisateurs authentifiés peuvent lire toutes les tâches
CREATE POLICY "Allow select for authenticated users"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : Tous les utilisateurs authentifiés peuvent créer des tâches
CREATE POLICY "Allow insert for authenticated users"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE : Tous les utilisateurs authentifiés peuvent modifier toutes les tâches
CREATE POLICY "Allow update for authenticated users"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE : Tous les utilisateurs authentifiés peuvent supprimer toutes les tâches
CREATE POLICY "Allow delete for authenticated users"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (true);

-- ÉTAPE 4 : Vérifier les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd;

-- ÉTAPE 5 : Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Policies RLS pour tasks créées !';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies actives :';
  RAISE NOTICE '   • SELECT : Tous les utilisateurs authentifiés';
  RAISE NOTICE '   • INSERT : Tous les utilisateurs authentifiés';
  RAISE NOTICE '   • UPDATE : Tous les utilisateurs authentifiés';
  RAISE NOTICE '   • DELETE : Tous les utilisateurs authentifiés';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 La création de tâches devrait maintenant fonctionner !';
  RAISE NOTICE '';
END $$;
