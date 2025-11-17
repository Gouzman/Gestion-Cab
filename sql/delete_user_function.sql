-- 🔧 Fonction RPC pour supprimer un utilisateur (profil + compte Auth)
-- Exécutez ce script dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_user_account(
  user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- 1. Supprimer le profil
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- 2. Supprimer de users si existe
  DELETE FROM public.users WHERE id = user_id;
  
  -- 3. Supprimer le compte Auth
  DELETE FROM auth.users WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution aux admins uniquement
GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;

-- Créer une politique RLS pour restreindre l'exécution aux admins
-- Note: Cette fonction utilise SECURITY DEFINER donc elle s'exécute avec les droits du créateur
-- Il faut donc vérifier côté application que seuls les admins peuvent l'appeler
