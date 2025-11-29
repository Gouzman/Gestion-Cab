-- =====================================================
-- FONCTIONS RPC POUR LE NOUVEAU SYSTÈME D'AUTHENTIFICATION
-- =====================================================

-- 1️⃣ FONCTION : Générer un mot de passe initial aléatoire
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_initial_password()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  password TEXT := '';
  i INTEGER;
BEGIN
  -- Générer un mot de passe de 16 caractères
  FOR i IN 1..16 LOOP
    password := password || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  RETURN password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_initial_password() IS 
'Génère un mot de passe initial aléatoire sécurisé de 16 caractères';


-- 2️⃣ FONCTION : Vérifier si l'utilisateur doit changer son mot de passe
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_must_change_password(
  user_identifier TEXT  -- Email ou matricule
)
RETURNS JSON AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Rechercher l'utilisateur par email
  SELECT 
    id, 
    email, 
    name,
    must_change_password, 
    has_custom_password,
    admin_approved,
    role
  INTO profile_record
  FROM public.profiles
  WHERE email = user_identifier
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Aucun utilisateur trouvé avec cet identifiant'
    );
  END IF;
  
  -- Vérifier si l'admin a approuvé (sauf pour les admins)
  IF profile_record.role != 'admin' AND NOT profile_record.admin_approved THEN
    RETURN json_build_object(
      'success', false,
      'error', 'pending_approval',
      'message', 'Votre compte est en attente de validation par l''administrateur'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user_id', profile_record.id,
    'email', profile_record.email,
    'name', profile_record.name,
    'must_change_password', profile_record.must_change_password,
    'has_custom_password', profile_record.has_custom_password
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'technical_error',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_must_change_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_must_change_password TO anon;


-- 3️⃣ FONCTION : Définir le mot de passe personnel et la phrase secrète
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_personal_credentials(
  user_email TEXT,
  new_password TEXT,
  secret_question TEXT,
  secret_answer TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
  answer_hash TEXT;
  question_encrypted TEXT;
BEGIN
  -- 1. Récupérer l'ID utilisateur
  SELECT id INTO user_id_var
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;
  
  IF user_id_var IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- 2. Vérifier que le mot de passe n'a pas été utilisé avant (historique)
  IF EXISTS (
    SELECT 1 FROM public.password_history
    WHERE user_id = user_id_var
    AND password_hash = crypt(new_password, password_hash)
    LIMIT 1
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'password_reused',
      'message', 'Ce mot de passe a déjà été utilisé. Veuillez en choisir un nouveau.'
    );
  END IF;
  
  -- 3. Hasher la réponse secrète (case-insensitive)
  answer_hash := crypt(lower(trim(secret_answer)), gen_salt('bf'));
  
  -- 4. "Chiffrer" la question (simple encoding base64 pour l'instant)
  question_encrypted := encode(secret_question::bytea, 'base64');
  
  -- 5. Mettre à jour le mot de passe dans auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id_var;
  
  -- 6. Mettre à jour le profil
  UPDATE public.profiles
  SET 
    must_change_password = false,
    has_custom_password = true,
    password_set = true,
    last_password_change = now(),
    password_change_count = password_change_count + 1,
    initial_password = NULL  -- Supprimer le mot de passe générique
  WHERE id = user_id_var;
  
  -- 7. Insérer la phrase secrète
  INSERT INTO public.user_secret_phrases (user_id, question_encrypted, answer_hash)
  VALUES (user_id_var, question_encrypted, answer_hash)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    question_encrypted = EXCLUDED.question_encrypted,
    answer_hash = EXCLUDED.answer_hash,
    updated_at = now();
  
  -- 8. Ajouter au password history
  INSERT INTO public.password_history (user_id, password_hash)
  VALUES (user_id_var, crypt(new_password, gen_salt('bf')));
  
  RETURN json_build_object(
    'success', true,
    'user_id', user_id_var,
    'message', 'Identifiants personnels définis avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_personal_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_personal_credentials TO anon;


-- 4️⃣ FONCTION : Récupérer la question secrète
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_secret_question(
  user_identifier TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
  question_encrypted TEXT;
  question_decrypted TEXT;
BEGIN
  -- 1. Récupérer l'ID utilisateur
  SELECT id INTO user_id_var
  FROM public.profiles
  WHERE email = user_identifier
  LIMIT 1;
  
  IF user_id_var IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found'
    );
  END IF;
  
  -- 2. Récupérer la question chiffrée
  SELECT question_encrypted INTO question_encrypted
  FROM public.user_secret_phrases
  WHERE user_id = user_id_var;
  
  IF question_encrypted IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_secret_phrase',
      'message', 'Aucune phrase secrète n''a été configurée pour ce compte'
    );
  END IF;
  
  -- 3. Déchiffrer la question
  question_decrypted := convert_from(decode(question_encrypted, 'base64'), 'UTF8');
  
  RETURN json_build_object(
    'success', true,
    'user_id', user_id_var,
    'question', question_decrypted
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_secret_question TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secret_question TO anon;


-- 5️⃣ FONCTION : Vérifier la réponse secrète et réinitialiser le mot de passe
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_secret_answer_and_reset(
  user_identifier TEXT,
  secret_answer TEXT,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
  stored_answer_hash TEXT;
  answer_valid BOOLEAN;
BEGIN
  -- 1. Récupérer l'ID utilisateur
  SELECT id INTO user_id_var
  FROM public.profiles
  WHERE email = user_identifier
  LIMIT 1;
  
  IF user_id_var IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found'
    );
  END IF;
  
  -- 2. Récupérer le hash de la réponse
  SELECT answer_hash INTO stored_answer_hash
  FROM public.user_secret_phrases
  WHERE user_id = user_id_var;
  
  IF stored_answer_hash IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_secret_phrase'
    );
  END IF;
  
  -- 3. Vérifier la réponse (case-insensitive)
  answer_valid := (crypt(lower(trim(secret_answer)), stored_answer_hash) = stored_answer_hash);
  
  -- 4. Journaliser la tentative
  INSERT INTO public.login_attempts (identifier, attempt_type, success, error_message)
  VALUES (
    user_identifier, 
    'secret_phrase', 
    answer_valid,
    CASE WHEN answer_valid THEN NULL ELSE 'Wrong answer' END
  );
  
  IF NOT answer_valid THEN
    RETURN json_build_object(
      'success', false,
      'error', 'wrong_answer',
      'message', 'La réponse est incorrecte'
    );
  END IF;
  
  -- 5. Vérifier que le nouveau mot de passe n'a pas été utilisé avant
  IF EXISTS (
    SELECT 1 FROM public.password_history
    WHERE user_id = user_id_var
    AND password_hash = crypt(new_password, password_hash)
    LIMIT 1
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'password_reused',
      'message', 'Ce mot de passe a déjà été utilisé'
    );
  END IF;
  
  -- 6. Mettre à jour le mot de passe
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id_var;
  
  -- 7. Mettre à jour le profil
  UPDATE public.profiles
  SET 
    last_password_change = now(),
    password_change_count = password_change_count + 1
  WHERE id = user_id_var;
  
  -- 8. Ajouter au password history
  INSERT INTO public.password_history (user_id, password_hash)
  VALUES (user_id_var, crypt(new_password, gen_salt('bf')));
  
  -- 9. Journaliser le succès
  INSERT INTO public.login_attempts (identifier, attempt_type, success)
  VALUES (user_identifier, 'password_reset', true);
  
  RETURN json_build_object(
    'success', true,
    'user_id', user_id_var,
    'message', 'Mot de passe réinitialisé avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_secret_answer_and_reset TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_secret_answer_and_reset TO anon;


-- 6️⃣ FONCTION : Journaliser une tentative de connexion
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  user_identifier TEXT,
  attempt_success BOOLEAN,
  attempt_error TEXT DEFAULT NULL,
  user_ip TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.login_attempts (
    identifier, 
    attempt_type, 
    success, 
    error_message,
    ip_address,
    user_agent
  )
  VALUES (
    user_identifier, 
    'login', 
    attempt_success,
    attempt_error,
    user_ip,
    user_agent_string
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_attempt TO anon;


-- 7️⃣ FONCTION : Créer un collaborateur avec mot de passe initial
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_collaborator_with_initial_password(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_function TEXT,
  initial_password TEXT  -- Mot de passe généré par l'admin
)
RETURNS JSON AS $$
DECLARE
  password_hash TEXT;
BEGIN
  -- 1. Hasher le mot de passe initial
  password_hash := crypt(initial_password, gen_salt('bf'));
  
  -- 2. Insérer dans profiles avec must_change_password = true
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    function, 
    initial_password,
    password_set, 
    must_change_password,
    has_custom_password,
    admin_approved
  )
  VALUES (
    user_id, 
    user_email, 
    user_name, 
    user_role, 
    user_function,
    password_hash,
    false,   -- password_set = false car c'est le mot de passe générique
    true,    -- must_change_password = true
    false,   -- has_custom_password = false
    false    -- admin_approved = false (validation par admin requise)
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    function = EXCLUDED.function,
    initial_password = EXCLUDED.initial_password,
    must_change_password = EXCLUDED.must_change_password;
  
  RETURN json_build_object(
    'success', true,
    'user_id', user_id,
    'initial_password', initial_password  -- Retourne le mot de passe en clair pour l'admin
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_collaborator_with_initial_password TO authenticated;


-- ✅ Fonctions créées avec succès
SELECT 
  '✅ Fonctions RPC créées avec succès' as message,
  'check_must_change_password, set_personal_credentials, get_secret_question, verify_secret_answer_and_reset, log_login_attempt, create_collaborator_with_initial_password' as functions;
