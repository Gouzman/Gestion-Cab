-- =====================================================
-- SYSTÈME DE RÉINITIALISATION DE MOT DE PASSE
-- =====================================================
-- Flux complet :
-- 1. Utilisateur échoue 3x à la phrase secrète
-- 2. Création d'une demande de réinitialisation
-- 3. Admin approuve la demande
-- 4. Utilisateur réinitialise comme première connexion
-- =====================================================

-- 1️⃣ TABLE DES DEMANDES DE RÉINITIALISATION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_title TEXT, -- Titre d'accréditation / fonction
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  failed_attempts INTEGER DEFAULT 3, -- Nombre de tentatives échouées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id 
ON public.password_reset_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status 
ON public.password_reset_requests(status);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_requested_at 
ON public.password_reset_requests(requested_at DESC);

-- RLS : Activer la sécurité au niveau des lignes
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres demandes
DROP POLICY IF EXISTS "Users can view own reset requests" ON public.password_reset_requests;
CREATE POLICY "Users can view own reset requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent créer leurs demandes
DROP POLICY IF EXISTS "Users can create reset requests" ON public.password_reset_requests;
CREATE POLICY "Users can create reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Politique : Les admins peuvent tout voir et modifier
DROP POLICY IF EXISTS "Admins can view all reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can view all reset requests"
  ON public.password_reset_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les gérants peuvent tout voir et modifier
DROP POLICY IF EXISTS "Gerants can view all reset requests" ON public.password_reset_requests;
CREATE POLICY "Gerants can view all reset requests"
  ON public.password_reset_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (function = 'Gerant' OR function = 'Associe Emerite' OR role = 'gerant')
    )
  );


-- 2️⃣ FONCTION : Récupérer la phrase secrète pour un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_secret_question(
  user_identifier TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  question TEXT,
  user_email TEXT,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
  question_encrypted_var TEXT;
BEGIN
  -- Rechercher l'utilisateur par email ou matricule
  SELECT p.id INTO user_id_var
  FROM public.profiles p
  WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(user_identifier))
     OR LOWER(TRIM(p.matricule)) = LOWER(TRIM(user_identifier))
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'user_not_found'::TEXT;
    RETURN;
  END IF;

  -- Récupérer la question secrète chiffrée
  SELECT usp.question_encrypted INTO question_encrypted_var
  FROM public.user_secret_phrases usp
  WHERE usp.user_id = user_id_var;

  IF question_encrypted_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'no_secret_phrase'::TEXT;
    RETURN;
  END IF;

  -- Déchiffrer la question
  RETURN QUERY 
  SELECT 
    true,
    pgp_sym_decrypt(question_encrypted_var::bytea, 'secret_phrase_key')::TEXT,
    (SELECT email FROM public.profiles WHERE id = user_id_var),
    NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'technical_error'::TEXT;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_secret_question(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_secret_question(TEXT) TO authenticated;


-- 3️⃣ FONCTION : Vérifier la réponse secrète
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_secret_answer(
  user_identifier TEXT,
  user_answer TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
  answer_hash_var TEXT;
BEGIN
  -- Rechercher l'utilisateur
  SELECT p.id INTO user_id_var
  FROM public.profiles p
  WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(user_identifier))
     OR LOWER(TRIM(p.matricule)) = LOWER(TRIM(user_identifier))
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'user_not_found'::TEXT;
    RETURN;
  END IF;

  -- Récupérer le hash de la réponse
  SELECT usp.answer_hash INTO answer_hash_var
  FROM public.user_secret_phrases usp
  WHERE usp.user_id = user_id_var;

  IF answer_hash_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'no_secret_phrase'::TEXT;
    RETURN;
  END IF;

  -- Vérifier la réponse avec bcrypt
  IF crypt(TRIM(user_answer), answer_hash_var) = answer_hash_var THEN
    RETURN QUERY SELECT true, user_id_var, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, 'invalid_answer'::TEXT;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'technical_error'::TEXT;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.verify_secret_answer(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_secret_answer(TEXT, TEXT) TO authenticated;


-- 4️⃣ FONCTION : Créer une demande de réinitialisation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_reset_request(
  user_identifier TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  request_id UUID,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
  user_email_var TEXT;
  user_name_var TEXT;
  user_title_var TEXT;
  existing_pending_request UUID;
  new_request_id UUID;
BEGIN
  -- Rechercher l'utilisateur
  SELECT p.id, p.email, p.name, p.function 
  INTO user_id_var, user_email_var, user_name_var, user_title_var
  FROM public.profiles p
  WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(user_identifier))
     OR LOWER(TRIM(p.matricule)) = LOWER(TRIM(user_identifier))
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'user_not_found'::TEXT;
    RETURN;
  END IF;

  -- Vérifier s'il y a déjà une demande en attente
  SELECT id INTO existing_pending_request
  FROM public.password_reset_requests
  WHERE user_id = user_id_var
    AND status = 'pending'
  LIMIT 1;

  IF existing_pending_request IS NOT NULL THEN
    RETURN QUERY SELECT true, existing_pending_request, 'already_pending'::TEXT;
    RETURN;
  END IF;

  -- Créer une nouvelle demande
  INSERT INTO public.password_reset_requests (
    user_id,
    user_email,
    user_name,
    user_title,
    status,
    failed_attempts
  )
  VALUES (
    user_id_var,
    user_email_var,
    user_name_var,
    user_title_var,
    'pending',
    3
  )
  RETURNING id INTO new_request_id;

  RETURN QUERY SELECT true, new_request_id, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'technical_error'::TEXT;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_reset_request(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_reset_request(TEXT) TO authenticated;


-- 5️⃣ FONCTION : Approuver une demande de réinitialisation (Admin ou Gérant)
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_reset_request(
  request_id_param UUID,
  admin_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  user_email TEXT,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  target_user_email TEXT;
  is_authorized BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin ou gérant
  SELECT (
    role = 'admin' 
    OR role = 'gerant' 
    OR function = 'Gerant' 
    OR function = 'Associe Emerite'
  ) INTO is_authorized
  FROM public.profiles
  WHERE id = admin_user_id;

  IF NOT is_authorized THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Récupérer les infos de la demande
  SELECT user_id, user_email INTO target_user_id, target_user_email
  FROM public.password_reset_requests
  WHERE id = request_id_param
    AND status = 'pending';

  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'request_not_found'::TEXT;
    RETURN;
  END IF;

  -- Approuver la demande
  UPDATE public.password_reset_requests
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = admin_user_id,
    updated_at = NOW()
  WHERE id = request_id_param;

  -- Réactiver le flag must_change_password pour forcer la réinitialisation
  UPDATE public.profiles
  SET 
    must_change_password = true,
    has_custom_password = false,
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN QUERY SELECT true, target_user_email, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'technical_error'::TEXT;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.approve_reset_request(UUID, UUID) TO authenticated;


-- 6️⃣ FONCTION : Rejeter une demande de réinitialisation (Admin ou Gérant)
-- =====================================================
CREATE OR REPLACE FUNCTION public.reject_reset_request(
  request_id_param UUID,
  admin_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_authorized BOOLEAN;
  request_exists BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin ou gérant
  SELECT (
    role = 'admin' 
    OR role = 'gerant' 
    OR function = 'Gerant' 
    OR function = 'Associe Emerite'
  ) INTO is_authorized
  FROM public.profiles
  WHERE id = admin_user_id;

  IF NOT is_authorized THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Vérifier que la demande existe
  SELECT EXISTS(
    SELECT 1 FROM public.password_reset_requests
    WHERE id = request_id_param AND status = 'pending'
  ) INTO request_exists;

  IF NOT request_exists THEN
    RETURN QUERY SELECT false, 'request_not_found'::TEXT;
    RETURN;
  END IF;

  -- Rejeter la demande
  UPDATE public.password_reset_requests
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = admin_user_id,
    updated_at = NOW()
  WHERE id = request_id_param;

  RETURN QUERY SELECT true, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'technical_error'::TEXT;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.reject_reset_request(UUID, UUID) TO authenticated;


-- 7️⃣ TRIGGER : Mise à jour automatique du timestamp updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_password_reset_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_password_reset_requests_updated_at 
ON public.password_reset_requests;

CREATE TRIGGER trigger_update_password_reset_requests_updated_at
BEFORE UPDATE ON public.password_reset_requests
FOR EACH ROW
EXECUTE FUNCTION update_password_reset_requests_updated_at();


-- 8️⃣ FONCTION : Supprimer automatiquement les demandes traitées après 30 jours
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_reset_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_requests
  WHERE status IN ('approved', 'rejected')
    AND reviewed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.cleanup_old_reset_requests() TO authenticated;


-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.password_reset_requests IS 
'Demandes de réinitialisation de mot de passe après échec de la phrase secrète';

COMMENT ON FUNCTION public.get_user_secret_question(TEXT) IS 
'Récupère la question secrète pour un utilisateur (identifiant email ou matricule)';

COMMENT ON FUNCTION public.verify_secret_answer(TEXT, TEXT) IS 
'Vérifie la réponse à la phrase secrète (hashée avec bcrypt)';

COMMENT ON FUNCTION public.create_reset_request(TEXT) IS 
'Crée une demande de réinitialisation après 3 échecs de phrase secrète';

COMMENT ON FUNCTION public.approve_reset_request(UUID, UUID) IS 
'Approuve une demande de réinitialisation (Admin uniquement)';

COMMENT ON FUNCTION public.reject_reset_request(UUID, UUID) IS 
'Rejette une demande de réinitialisation (Admin uniquement)';

COMMENT ON FUNCTION public.cleanup_old_reset_requests() IS 
'Supprime les demandes traitées vieilles de plus de 30 jours';

-- =====================================================
-- ✅ INSTALLATION TERMINÉE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Système de réinitialisation de mot de passe installé avec succès';
  RAISE NOTICE '📋 Table : password_reset_requests';
  RAISE NOTICE '🔧 Fonctions RPC : 6 fonctions créées';
  RAISE NOTICE '🔒 RLS activé avec politiques de sécurité';
END $$;
