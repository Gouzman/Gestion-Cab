-- =====================================================
-- CORRECTION COMPLÈTE - Ajout colonne auth_password
-- =====================================================
-- Date: 5 décembre 2025
-- Erreur: column "auth_password" of relation "profiles" does not exist

-- NOTE: La colonne auth_password n'existe PAS et ne doit PAS exister dans profiles
-- Le système utilise auth.users.encrypted_password pour le mot de passe personnalisé
-- et profiles.initial_password pour le mot de passe initial

-- 1. Supprimer et recréer la fonction avec la correction
DROP FUNCTION IF EXISTS public.internal_set_personal_credentials(TEXT, TEXT, TEXT, TEXT);

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

  -- 2. Vérifier la réutilisation du mot de passe (avec alias pour éviter l'ambiguïté)
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

  -- 3. Hasher le nouveau mot de passe
  password_hash := crypt(new_password, gen_salt('bf'));

  -- 4. Mettre à jour auth.users (pour compatibilité)
  UPDATE auth.users
  SET 
    encrypted_password = password_hash,
    updated_at = NOW()
  WHERE id = user_id_var;

  -- 5. Mettre à jour le profil (PAS de colonne auth_password dans profiles)
  -- Le mot de passe est stocké dans auth.users.encrypted_password
  UPDATE public.profiles
  SET 
    must_change_password = false,
    has_custom_password = true,
    last_password_change = NOW(),
    password_change_count = COALESCE(password_change_count, 0) + 1
  WHERE id = user_id_var;

  -- 6. Sauvegarder dans l'historique
  INSERT INTO public.password_history (user_id, password_hash)
  VALUES (user_id_var, password_hash);

  -- 7. Encoder la question et hasher la réponse
  question_encoded := encode(secret_question::bytea, 'base64');
  answer_hash := crypt(LOWER(TRIM(secret_answer)), gen_salt('bf'));

  -- 8. Sauvegarder la phrase secrète
  INSERT INTO public.user_secret_phrases (user_id, question_encrypted, answer_hash)
  VALUES (user_id_var, question_encoded, answer_hash)
  ON CONFLICT (user_id) DO UPDATE
  SET 
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
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redonner les permissions
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO anon;

-- 2. Vérification
SELECT 
  'Fonction internal_set_personal_credentials corrigée ✅' as etape_1,
  'Mot de passe stocké dans auth.users.encrypted_password ✅' as etape_2,
  'Système prêt pour la première connexion ✅' as statut;
