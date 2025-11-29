-- =====================================================
-- VÉRIFICATION + CORRECTION COMPLÈTE
-- =====================================================
-- Ce script va :
-- 1. Vérifier ce qui existe
-- 2. Créer ce qui manque
-- 3. Corriger les problèmes
-- =====================================================

-- 🔍 ÉTAPE 1 : Vérifier les colonnes manquantes dans profiles
DO $$
BEGIN
  -- Ajouter initial_password si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'initial_password'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN initial_password TEXT;
    RAISE NOTICE '✅ Colonne initial_password ajoutée';
  END IF;

  -- Ajouter must_change_password si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne must_change_password ajoutée';
  END IF;

  -- Ajouter has_custom_password si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'has_custom_password'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN has_custom_password BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne has_custom_password ajoutée';
  END IF;

  -- Ajouter last_password_change si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_password_change'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne last_password_change ajoutée';
  END IF;

  -- Ajouter password_change_count si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_change_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_change_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne password_change_count ajoutée';
  END IF;
END $$;


-- 🔍 ÉTAPE 2 : Créer les tables manquantes
CREATE TABLE IF NOT EXISTS public.user_secret_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_encrypted TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);


-- 🔍 ÉTAPE 3 : Activer RLS sur les nouvelles tables
ALTER TABLE public.user_secret_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own secret phrases" ON public.user_secret_phrases;
CREATE POLICY "Users can view own secret phrases" 
  ON public.user_secret_phrases FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own secret phrases" ON public.user_secret_phrases;
CREATE POLICY "Users can update own secret phrases" 
  ON public.user_secret_phrases FOR ALL 
  USING (user_id = auth.uid());


-- 🔍 ÉTAPE 4 : Recréer TOUTES les fonctions (avec correction)
-- Fonction: internal_login
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
  -- Rechercher l'utilisateur
  SELECT 
    p.id, p.email, p.name, p.role, p.function,
    COALESCE(p.initial_password, '') as initial_password,
    COALESCE(p.must_change_password, false) as must_change_password,
    COALESCE(p.has_custom_password, false) as has_custom_password,
    COALESCE(p.admin_approved, true) as admin_approved,
    COALESCE(u.encrypted_password, '') as auth_password
  INTO profile_record
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.email = user_identifier
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_credentials', 'message', 'Identifiant ou mot de passe incorrect');
  END IF;

  -- Vérifier l'approbation admin (sauf pour admin)
  IF profile_record.role != 'admin' AND NOT profile_record.admin_approved THEN
    RETURN json_build_object('success', false, 'error', 'pending_approval', 'message', 'Votre compte est en attente de validation');
  END IF;

  -- Vérifier le mot de passe
  IF NOT profile_record.has_custom_password AND profile_record.initial_password != '' THEN
    -- Mot de passe générique
    password_match := (profile_record.initial_password = crypt(user_password, profile_record.initial_password));
  ELSIF profile_record.auth_password != '' THEN
    -- Mot de passe personnalisé
    password_match := (profile_record.auth_password = crypt(user_password, profile_record.auth_password));
  ELSE
    -- Pas de mot de passe défini, utiliser le mot de passe auth par défaut
    password_match := (profile_record.auth_password = crypt(user_password, profile_record.auth_password));
  END IF;

  IF NOT password_match THEN
    RETURN json_build_object('success', false, 'error', 'invalid_credentials', 'message', 'Identifiant ou mot de passe incorrect');
  END IF;

  -- Créer une session
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


-- 🔍 ÉTAPE 5 : Test rapide
SELECT 
  '✅ VÉRIFICATION COMPLÈTE TERMINÉE' as message,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('initial_password', 'must_change_password', 'has_custom_password')) as colonnes_profiles,
  (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('internal_sessions', 'user_secret_phrases', 'password_history')) as tables_creees,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'internal_login') as fonction_login;

-- Message final
SELECT '🎉 Système prêt - Rafraîchissez votre navigateur (Ctrl+Shift+R)' as next_step;
