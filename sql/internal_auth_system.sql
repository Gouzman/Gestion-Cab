-- =====================================================
-- SYSTÈME D'AUTHENTIFICATION INTERNE (100% sans Supabase Auth)
-- =====================================================

-- 1️⃣ Créer la table de sessions internes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.internal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_internal_sessions_user_id ON public.internal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_sessions_token ON public.internal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_internal_sessions_expires ON public.internal_sessions(expires_at);

-- RLS pour les sessions
ALTER TABLE public.internal_sessions ENABLE ROW LEVEL SECURITY;

-- Politique : Un utilisateur ne peut voir que ses propres sessions
CREATE POLICY "Users can view own sessions"
  ON public.internal_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique : Permettre la création de sessions (pour le login)
CREATE POLICY "Allow session creation"
  ON public.internal_sessions
  FOR INSERT
  WITH CHECK (true);

-- Politique : Permettre la suppression de sessions (pour le logout)
CREATE POLICY "Users can delete own sessions"
  ON public.internal_sessions
  FOR DELETE
  USING (user_id = auth.uid());


-- 2️⃣ FONCTION : Connexion interne (vérification mot de passe hashé)
-- =====================================================
CREATE OR REPLACE FUNCTION public.internal_login(
  user_identifier TEXT,
  user_password TEXT,
  user_agent_text TEXT DEFAULT NULL,
  ip_addr TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  profile_record RECORD;
  password_match BOOLEAN;
  session_token TEXT;
  session_expires TIMESTAMP WITH TIME ZONE;
  new_session_id UUID;
BEGIN
  -- 1. Rechercher l'utilisateur
  SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    p.function,
    p.initial_password,
    p.must_change_password,
    p.has_custom_password,
    p.admin_approved,
    u.encrypted_password as auth_password
  INTO profile_record
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.email = user_identifier
  LIMIT 1;

  IF NOT FOUND THEN
    -- Journaliser la tentative échouée
    PERFORM public.log_login_attempt(
      user_identifier,
      false,
      'Utilisateur introuvable',
      ip_addr,
      user_agent_text
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_credentials',
      'message', 'Identifiant ou mot de passe incorrect'
    );
  END IF;

  -- 2. Vérifier l'approbation admin (sauf pour les admins)
  IF profile_record.role != 'admin' AND NOT profile_record.admin_approved THEN
    RETURN json_build_object(
      'success', false,
      'error', 'pending_approval',
      'message', 'Votre compte est en attente de validation'
    );
  END IF;

  -- 3. Vérifier le mot de passe
  -- Si l'utilisateur n'a pas de mot de passe personnalisé, vérifier contre initial_password
  IF NOT profile_record.has_custom_password THEN
    password_match := (profile_record.initial_password = crypt(user_password, profile_record.initial_password));
  ELSE
    -- Sinon, vérifier contre le mot de passe auth
    password_match := (profile_record.auth_password = crypt(user_password, profile_record.auth_password));
  END IF;

  IF NOT password_match THEN
    -- Journaliser la tentative échouée
    PERFORM public.log_login_attempt(
      user_identifier,
      false,
      'Mot de passe incorrect',
      ip_addr,
      user_agent_text
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_credentials',
      'message', 'Identifiant ou mot de passe incorrect'
    );
  END IF;

  -- 4. Mot de passe correct - Créer une session
  session_token := encode(gen_random_bytes(32), 'base64');
  session_expires := NOW() + INTERVAL '7 days';

  INSERT INTO public.internal_sessions (
    user_id,
    session_token,
    expires_at,
    user_agent,
    ip_address
  )
  VALUES (
    profile_record.id,
    session_token,
    session_expires,
    user_agent_text,
    ip_addr
  )
  RETURNING id INTO new_session_id;

  -- 5. Journaliser la connexion réussie
  PERFORM public.log_login_attempt(
    user_identifier,
    true,
    NULL,
    ip_addr,
    user_agent_text
  );

  -- 6. Retourner les informations de session
  RETURN json_build_object(
    'success', true,
    'session_token', session_token,
    'session_id', new_session_id,
    'expires_at', session_expires,
    'user', json_build_object(
      'id', profile_record.id,
      'email', profile_record.email,
      'name', profile_record.name,
      'role', profile_record.role,
      'function', profile_record.function,
      'must_change_password', profile_record.must_change_password,
      'has_custom_password', profile_record.has_custom_password
    )
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

GRANT EXECUTE ON FUNCTION public.internal_login TO anon;
GRANT EXECUTE ON FUNCTION public.internal_login TO authenticated;


-- 3️⃣ FONCTION : Vérifier une session active
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_internal_session(
  session_token_param TEXT
)
RETURNS JSON AS $$
DECLARE
  session_record RECORD;
  profile_record RECORD;
BEGIN
  -- 1. Rechercher la session
  SELECT 
    s.id,
    s.user_id,
    s.expires_at,
    s.last_activity
  INTO session_record
  FROM public.internal_sessions s
  WHERE s.session_token = session_token_param
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_session',
      'message', 'Session invalide ou expirée'
    );
  END IF;

  -- 2. Vérifier l'expiration
  IF session_record.expires_at < NOW() THEN
    -- Supprimer la session expirée
    DELETE FROM public.internal_sessions WHERE id = session_record.id;
    
    RETURN json_build_object(
      'success', false,
      'error', 'session_expired',
      'message', 'Session expirée'
    );
  END IF;

  -- 3. Mettre à jour last_activity
  UPDATE public.internal_sessions
  SET last_activity = NOW()
  WHERE id = session_record.id;

  -- 4. Récupérer les informations utilisateur
  SELECT 
    id,
    email,
    name,
    role,
    function,
    must_change_password,
    has_custom_password,
    admin_approved
  INTO profile_record
  FROM public.profiles
  WHERE id = session_record.user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Utilisateur introuvable'
    );
  END IF;

  -- 5. Retourner les informations utilisateur
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', profile_record.id,
      'email', profile_record.email,
      'name', profile_record.name,
      'role', profile_record.role,
      'function', profile_record.function,
      'must_change_password', profile_record.must_change_password,
      'has_custom_password', profile_record.has_custom_password,
      'admin_approved', profile_record.admin_approved
    )
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

GRANT EXECUTE ON FUNCTION public.verify_internal_session TO anon;
GRANT EXECUTE ON FUNCTION public.verify_internal_session TO authenticated;


-- 4️⃣ FONCTION : Déconnexion (suppression de session)
-- =====================================================
CREATE OR REPLACE FUNCTION public.internal_logout(
  session_token_param TEXT
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.internal_sessions
  WHERE session_token = session_token_param;

  RETURN json_build_object(
    'success', true,
    'message', 'Déconnexion réussie'
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

GRANT EXECUTE ON FUNCTION public.internal_logout TO anon;
GRANT EXECUTE ON FUNCTION public.internal_logout TO authenticated;


-- 5️⃣ FONCTION : Nettoyer les sessions expirées (à exécuter périodiquement)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.internal_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'deleted_sessions', deleted_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions TO authenticated;


-- 6️⃣ FONCTION : Mise à jour du mot de passe (interne, pas Supabase Auth)
-- =====================================================
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

  -- 2. Vérifier la réutilisation du mot de passe
  IF EXISTS (
    SELECT 1 FROM public.password_history
    WHERE user_id = user_id_var
    AND password_hash = crypt(new_password, password_hash)
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

  -- 5. Mettre à jour le profil
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
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO anon;


-- ✅ Système d'authentification interne créé
SELECT 
  '✅ Système d''authentification interne créé' as message,
  'Fonctions: internal_login, verify_internal_session, internal_logout, internal_set_personal_credentials' as functions;
