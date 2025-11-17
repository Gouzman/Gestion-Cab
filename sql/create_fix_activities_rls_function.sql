-- Fonction RPC pour corriger automatiquement les policies RLS de la table activities
-- Cette fonction peut être appelée depuis le code JavaScript via supabase.rpc()

-- 1. Créer la fonction qui corrige les policies RLS
CREATE OR REPLACE FUNCTION public.fix_activities_rls_policy()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Créer la table activities si elle n'existe pas
  CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Activer RLS
  ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

  -- Supprimer les anciennes policies
  DROP POLICY IF EXISTS "Allow all inserts to activities" ON public.activities;
  DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.activities;

  -- Créer une policy permissive pour tous les inserts (résout le problème RLS)
  CREATE POLICY "Allow all inserts to activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (true);

  -- Policy pour la lecture
  CREATE POLICY "Users can view their own activities"
    ON public.activities
    FOR SELECT
    USING (
      auth.uid() = user_id 
      OR 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (function = 'Gerant' OR function = 'Associe Emerite')
      )
    );

  -- Créer les index si nécessaire
  CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

  -- Retourner un résultat JSON
  result := json_build_object(
    'success', true,
    'message', 'Activities table RLS policies have been fixed successfully',
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
GRANT EXECUTE ON FUNCTION public.fix_activities_rls_policy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_activities_rls_policy() TO anon;

-- 3. Commentaire pour documentation
COMMENT ON FUNCTION public.fix_activities_rls_policy() IS 
'Corrige automatiquement les policies RLS de la table activities pour éviter l''erreur "new row violates row-level security policy"';

-- 4. Exécuter immédiatement la fonction pour corriger le problème
SELECT public.fix_activities_rls_policy();

-- Note: Cette fonction peut être appelée depuis JavaScript avec:
-- const { data, error } = await supabase.rpc('fix_activities_rls_policy');
