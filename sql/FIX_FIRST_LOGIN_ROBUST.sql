-- =====================================================
-- VERSION SIMPLIFIÉE - CORRECTION PREMIÈRE CONNEXION
-- =====================================================
-- Cette version gère les cas où certaines tables peuvent ne pas exister
-- Date: 5 décembre 2025

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.internal_set_personal_credentials(TEXT, TEXT, TEXT, TEXT);

-- Recréer avec une version plus robuste
CREATE OR REPLACE FUNCTION public.internal_set_personal_credentials(
  user_email TEXT,
  new_password TEXT,
  secret_question TEXT,
  secret_answer TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
  answer_hash TEXT;
  password_hash TEXT;
  question_encoded TEXT;
  has_password_history BOOLEAN;
  has_secret_phrases BOOLEAN;
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

  -- 2. Vérifier si les tables optionnelles existent
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'password_history'
  ) INTO has_password_history;

  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_secret_phrases'
  ) INTO has_secret_phrases;

  -- 3. Vérifier la réutilisation du mot de passe (si la table existe)
  IF has_password_history THEN
    IF EXISTS (
      SELECT 1 FROM public.password_history ph
      WHERE ph.user_id = user_id_var
      AND ph.password_hash = crypt(new_password, ph.password_hash)
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'password_reused',
        'message', 'Ce mot de passe a déjà été utilisé'
      );
    END IF;
  END IF;

  -- 4. Hasher le nouveau mot de passe
  password_hash := crypt(new_password, gen_salt('bf'));

  -- 5. Mettre à jour auth.users (si l'utilisateur existe dans auth)
  UPDATE auth.users
  SET 
    encrypted_password = password_hash,
    updated_at = NOW()
  WHERE id = user_id_var;
  -- Ne pas échouer si l'utilisateur n'existe pas dans auth.users

  -- 6. Mettre à jour le profil
  -- Le mot de passe est stocké dans auth.users.encrypted_password, pas dans profiles
  UPDATE public.profiles
  SET 
    must_change_password = false,
    has_custom_password = true,
    last_password_change = NOW(),
    password_change_count = COALESCE(password_change_count, 0) + 1
  WHERE id = user_id_var;

  -- 7. Sauvegarder dans l'historique (si la table existe)
  IF has_password_history THEN
    INSERT INTO public.password_history (user_id, password_hash)
    VALUES (user_id_var, password_hash);
  END IF;

  -- 8. Sauvegarder la phrase secrète (si la table existe)
  IF has_secret_phrases THEN
    question_encoded := encode(secret_question::bytea, 'base64');
    answer_hash := crypt(LOWER(TRIM(secret_answer)), gen_salt('bf'));

    INSERT INTO public.user_secret_phrases (user_id, question_encrypted, answer_hash)
    VALUES (user_id_var, question_encoded, answer_hash)
    ON CONFLICT (user_id) DO UPDATE
    SET 
      question_encrypted = EXCLUDED.question_encrypted,
      answer_hash = EXCLUDED.answer_hash,
      updated_at = NOW();
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Identifiants personnels définis avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Retourner le message d'erreur détaillé pour le debug
    RETURN json_build_object(
      'success', false,
      'error', 'technical_error',
      'message', SQLERRM,
      'detail', SQLSTATE,
      'hint', 'Vérifiez que les tables password_history et user_secret_phrases existent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redonner les permissions
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO anon;

-- Vérification
SELECT 
  'Fonction corrigée (version robuste)' as status,
  'Gère les cas où certaines tables peuvent ne pas exister' as description;
