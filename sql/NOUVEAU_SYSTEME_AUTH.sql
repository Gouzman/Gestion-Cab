-- =====================================================
-- ✅ SCRIPT MINIMAL - NOUVEAU SYSTÈME D'AUTHENTIFICATION
-- =====================================================
-- Copiez-collez CE SCRIPT COMPLET dans Supabase SQL Editor
-- Puis cliquez sur RUN
-- =====================================================

-- 1️⃣ Créer la table internal_sessions
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

CREATE INDEX IF NOT EXISTS idx_internal_sessions_user_id ON public.internal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_sessions_token ON public.internal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_internal_sessions_expires ON public.internal_sessions(expires_at);

ALTER TABLE public.internal_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.internal_sessions;
CREATE POLICY "Users can view own sessions" ON public.internal_sessions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow session creation" ON public.internal_sessions;
CREATE POLICY "Allow session creation" ON public.internal_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.internal_sessions;
CREATE POLICY "Users can delete own sessions" ON public.internal_sessions FOR DELETE USING (user_id = auth.uid());


-- 2️⃣ Fonction: internal_login
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
  SELECT 
    p.id, p.email, p.name, p.role, p.function,
    p.initial_password, p.must_change_password, p.has_custom_password, p.admin_approved,
    u.encrypted_password as auth_password
  INTO profile_record
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.email = user_identifier
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_credentials', 'message', 'Identifiant ou mot de passe incorrect');
  END IF;

  IF profile_record.role != 'admin' AND NOT profile_record.admin_approved THEN
    RETURN json_build_object('success', false, 'error', 'pending_approval', 'message', 'Votre compte est en attente de validation');
  END IF;

  IF NOT profile_record.has_custom_password THEN
    password_match := (profile_record.initial_password = crypt(user_password, profile_record.initial_password));
  ELSE
    password_match := (profile_record.auth_password = crypt(user_password, profile_record.auth_password));
  END IF;

  IF NOT password_match THEN
    RETURN json_build_object('success', false, 'error', 'invalid_credentials', 'message', 'Identifiant ou mot de passe incorrect');
  END IF;

  session_token := encode(gen_random_bytes(32), 'base64');
  session_expires := NOW() + INTERVAL '7 days';

  INSERT INTO public.internal_sessions (user_id, session_token, expires_at, user_agent, ip_address)
  VALUES (profile_record.id, session_token, session_expires, user_agent_text, ip_addr)
  RETURNING id INTO new_session_id;

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
    RETURN json_build_object('success', false, 'error', 'technical_error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.internal_login TO anon;
GRANT EXECUTE ON FUNCTION public.internal_login TO authenticated;


-- 3️⃣ Fonction: verify_internal_session
CREATE OR REPLACE FUNCTION public.verify_internal_session(
  session_token_param TEXT
)
RETURNS JSON AS $$
DECLARE
  session_record RECORD;
  profile_record RECORD;
BEGIN
  SELECT id, user_id, expires_at
  INTO session_record
  FROM public.internal_sessions
  WHERE session_token = session_token_param
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_session');
  END IF;

  IF session_record.expires_at < NOW() THEN
    DELETE FROM public.internal_sessions WHERE id = session_record.id;
    RETURN json_build_object('success', false, 'error', 'session_expired');
  END IF;

  UPDATE public.internal_sessions SET last_activity = NOW() WHERE id = session_record.id;

  SELECT id, email, name, role, function, must_change_password, has_custom_password, admin_approved
  INTO profile_record
  FROM public.profiles
  WHERE id = session_record.user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

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
    RETURN json_build_object('success', false, 'error', 'technical_error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_internal_session TO anon;
GRANT EXECUTE ON FUNCTION public.verify_internal_session TO authenticated;


-- 4️⃣ Fonction: internal_logout
CREATE OR REPLACE FUNCTION public.internal_logout(
  session_token_param TEXT
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.internal_sessions WHERE session_token = session_token_param;
  RETURN json_build_object('success', true, 'message', 'Déconnexion réussie');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'technical_error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.internal_logout TO anon;
GRANT EXECUTE ON FUNCTION public.internal_logout TO authenticated;


-- 5️⃣ Fonction: internal_set_personal_credentials
CREATE OR REPLACE FUNCTION public.internal_set_personal_credentials(
  user_email TEXT,
  new_password TEXT,
  secret_question TEXT,
  secret_answer TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
  password_hash TEXT;
  question_encoded TEXT;
  answer_hash TEXT;
BEGIN
  SELECT id INTO user_id_var FROM public.profiles WHERE email = user_email;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  password_hash := crypt(new_password, gen_salt('bf'));

  UPDATE auth.users SET encrypted_password = password_hash, updated_at = NOW() WHERE id = user_id_var;

  UPDATE public.profiles
  SET must_change_password = false, has_custom_password = true,
      last_password_change = NOW(), password_change_count = COALESCE(password_change_count, 0) + 1
  WHERE id = user_id_var;

  INSERT INTO public.password_history (user_id, password_hash) VALUES (user_id_var, password_hash);

  question_encoded := encode(secret_question::bytea, 'base64');
  answer_hash := crypt(LOWER(TRIM(secret_answer)), gen_salt('bf'));

  INSERT INTO public.user_secret_phrases (user_id, question_encrypted, answer_hash)
  VALUES (user_id_var, question_encoded, answer_hash)
  ON CONFLICT (user_id) DO UPDATE
  SET question_encrypted = EXCLUDED.question_encrypted, answer_hash = EXCLUDED.answer_hash, updated_at = NOW();

  RETURN json_build_object('success', true, 'message', 'Identifiants définis');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'technical_error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.internal_set_personal_credentials TO anon;


-- ✅ VALIDATION
SELECT '✅ DÉPLOIEMENT TERMINÉ' as message;
SELECT 'Rafraîchissez votre navigateur (Ctrl+Shift+R)' as next_step;
