-- =============================================
-- CORRECTION FONCTION internal_set_personal_credentials
-- =============================================

-- 1. Vérifier si la fonction existe
SELECT 
  p.proname as fonction,
  pg_get_function_arguments(p.oid) as parametres
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'internal_set_personal_credentials';

-- 2. Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.internal_set_personal_credentials(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.internal_set_personal_credentials(TEXT, TEXT, TEXT);

-- 3. Créer la fonction avec les bons paramètres
CREATE OR REPLACE FUNCTION public.internal_set_personal_credentials(
  user_email TEXT,
  new_password TEXT,
  secret_question TEXT,
  secret_answer TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
  answer_hash TEXT;
  password_hash TEXT;
  question_encoded TEXT;
BEGIN
  -- 1. Trouver l'utilisateur
  SELECT id INTO user_id_var
  FROM public.profiles
  WHERE email = user_email;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Utilisateur introuvable'
    );
  END IF;

  -- 2. Hasher le nouveau mot de passe
  password_hash := crypt(new_password, gen_salt('bf'));

  -- 3. Mettre à jour auth.users (pour compatibilité)
  UPDATE auth.users
  SET 
    encrypted_password = password_hash,
    updated_at = NOW()
  WHERE id = user_id_var;

  -- 4. Mettre à jour le profil
  UPDATE public.profiles
  SET 
    must_change_password = false,
    has_custom_password = true,
    last_password_change = NOW(),
    password_change_count = COALESCE(password_change_count, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id_var;

  -- 5. Enregistrer le mot de passe dans l'historique
  INSERT INTO public.password_history (user_id, password_hash, created_at)
  VALUES (user_id_var, password_hash, NOW());

  -- 6. Encoder la question secrète (base64)
  question_encoded := encode(secret_question::bytea, 'base64');

  -- 7. Hasher la réponse secrète
  answer_hash := crypt(LOWER(TRIM(secret_answer)), gen_salt('bf'));

  -- 8. Enregistrer la phrase secrète
  INSERT INTO public.user_secret_phrases (user_id, question_encrypted, answer_hash, created_at)
  VALUES (user_id_var, question_encoded, answer_hash, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    question_encrypted = EXCLUDED.question_encrypted,
    answer_hash = EXCLUDED.answer_hash,
    updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'message', 'Identifiants personnels définis avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'technical_error',
      'message', SQLERRM
    );
END;
$$;

-- 4. Donner les permissions
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials(TEXT, TEXT, TEXT, TEXT) TO anon;

-- 5. Vérifier que la fonction est bien créée
SELECT 
  p.proname as fonction,
  pg_get_function_arguments(p.oid) as parametres,
  'OK' as statut
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'internal_set_personal_credentials';
