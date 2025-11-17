-- Fonction RPC pour corriger automatiquement les policies RLS de la table tasks_files
-- Cette fonction peut être appelée depuis le code JavaScript via supabase.rpc()

-- 1. Créer la fonction qui corrige les policies RLS
CREATE OR REPLACE FUNCTION public.fix_tasks_files_rls_policy()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Créer la table tasks_files si elle n'existe pas
  CREATE TABLE IF NOT EXISTS public.tasks_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
  );

  -- Activer RLS
  ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

  -- Supprimer les anciennes policies restrictives
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

  -- Créer des policies permissives pour tous les utilisateurs authentifiés
  -- Note: Les clients Supabase utilisent le rôle 'anon' avec un JWT pour l'authentification
  
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

  -- Créer les index si nécessaire
  CREATE INDEX IF NOT EXISTS idx_tasks_files_task_id ON public.tasks_files(task_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_files_created_at ON public.tasks_files(created_at DESC);

  -- Retourner un résultat JSON
  result := json_build_object(
    'success', true,
    'message', 'tasks_files table RLS policies have been fixed successfully',
    'timestamp', NOW()
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, retourner un message d'erreur
  RETURN json_build_object(
    'success', false,
    'message', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;

-- 2. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.fix_tasks_files_rls_policy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_tasks_files_rls_policy() TO anon;

-- 3. Commentaire pour documentation
COMMENT ON FUNCTION public.fix_tasks_files_rls_policy() IS 
'Corrige automatiquement les policies RLS de la table tasks_files pour éviter l''erreur "new row violates row-level security policy"';

-- 4. Exécuter immédiatement la fonction pour corriger le problème
SELECT public.fix_tasks_files_rls_policy();

-- 5. Vérification des policies créées
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
WHERE tablename = 'tasks_files'
ORDER BY cmd;

-- Note: Cette fonction peut être appelée depuis JavaScript avec:
-- const { data, error } = await supabase.rpc('fix_tasks_files_rls_policy');
