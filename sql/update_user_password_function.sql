-- 🔧 Fonction RPC pour mettre à jour le mot de passe utilisateur
-- Exécutez ce script dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.update_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
BEGIN
  -- 1. Récupérer l'ID utilisateur depuis auth.users
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- 2. Mettre à jour le mot de passe dans auth.users
  -- Note: Cette approche nécessite des permissions spéciales
  -- Alternative: Utiliser l'API Admin de Supabase côté serveur
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id_var;

  RETURN json_build_object(
    'success', true,
    'user_id', user_id_var
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password TO anon;
