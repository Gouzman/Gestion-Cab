-- ============================================================
-- ALTERNATIVE : Policies RLS Ultra-Permissives pour tasks_files
-- ============================================================
-- Si le script fix_tasks_files_rls_final.sql ne résout pas le problème,
-- utilisez cette version ULTRA-PERMISSIVE (déconseillée en production)
-- ============================================================

-- ÉTAPE 1 : Activer RLS
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer TOUTES les policies existantes
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

-- ÉTAPE 3 : Créer des policies ULTRA-PERMISSIVES
-- ⚠️ ATTENTION : Ces policies autorisent TOUS les utilisateurs authentifiés
-- à faire TOUTES les opérations sans aucune restriction

CREATE POLICY "tasks_files_allow_all_authenticated"
  ON public.tasks_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ÉTAPE 4 : Vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks_files';

-- ÉTAPE 5 : Confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ========================================';
  RAISE NOTICE '⚠️  Policies ULTRA-PERMISSIVES activées !';
  RAISE NOTICE '⚠️  ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policy active :';
  RAISE NOTICE '   • ALL : Tous les utilisateurs authentifiés (USING: true, WITH CHECK: true)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATTENTION : Ces policies sont très permissives';
  RAISE NOTICE '⚠️  Une fois le problème résolu, remplacez-les par des policies plus restrictives';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 L''insertion dans tasks_files devrait maintenant fonctionner !';
  RAISE NOTICE '';
END $$;

-- ============================================================
-- NOTES DE SÉCURITÉ
-- ============================================================
-- ⚠️ Cette configuration autorise TOUS les utilisateurs authentifiés à :
--    • Lire TOUS les fichiers (même ceux des autres)
--    • Insérer des fichiers avec N'IMPORTE QUEL created_by
--    • Modifier TOUS les fichiers
--    • Supprimer TOUS les fichiers
--
-- ✅ Cette configuration est acceptable si :
--    • Vous êtes en phase de développement/debug
--    • Tous les utilisateurs sont de confiance
--    • Vous avez besoin de tester rapidement
--
-- ❌ Cette configuration est DÉCONSEILLÉE en production si :
--    • Vous avez plusieurs utilisateurs non-admin
--    • Vous souhaitez que chaque utilisateur gère uniquement ses fichiers
--    • Vous avez besoin de traçabilité et d'isolation des données
--
-- 📌 Recommandation : Une fois le problème résolu, revenez aux policies
--    du script fix_tasks_files_rls_final.sql qui offrent une meilleure sécurité.
-- ============================================================
