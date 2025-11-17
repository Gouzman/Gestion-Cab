-- 🔧 Fonction RPC pour créer un collaborateur (contourne RLS)
-- Exécutez ce script dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_collaborator(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_function TEXT
)
RETURNS JSON AS $$
DECLARE
  users_table_exists BOOLEAN;
BEGIN
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) INTO users_table_exists;

  -- Si la table users existe, insérer dedans
  IF users_table_exists THEN
    INSERT INTO public.users (id, email)
    VALUES (user_id, user_email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;

  -- Insérer dans profiles avec admin_approved = false par défaut
  INSERT INTO public.profiles (id, email, name, role, function, password_set, admin_approved)
  VALUES (user_id, user_email, user_name, user_role, user_function, false, false)
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    function = EXCLUDED.function,
    password_set = EXCLUDED.password_set;

  RETURN json_build_object(
    'success', true,
    'user_id', user_id
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
GRANT EXECUTE ON FUNCTION public.create_collaborator TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_collaborator TO anon;
