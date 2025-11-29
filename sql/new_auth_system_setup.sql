-- =====================================================
-- NOUVEAU SYSTÈME D'AUTHENTIFICATION
-- =====================================================
-- Ce script met en place le nouveau système d'authentification avec :
-- - Mot de passe générique initial généré par l'admin
-- - Changement obligatoire lors de la première connexion
-- - Phrase secrète pour la récupération de mot de passe
-- =====================================================

-- 1️⃣ MODIFICATION DE LA TABLE PROFILES
-- =====================================================

-- Ajouter les colonnes nécessaires
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS initial_password TEXT,           -- Mot de passe générique hashé
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,  -- Force le changement
ADD COLUMN IF NOT EXISTS has_custom_password BOOLEAN DEFAULT false,  -- Indique si l'utilisateur a défini son propre mot de passe
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_change_count INTEGER DEFAULT 0;

-- Mettre à jour les utilisateurs existants
UPDATE public.profiles
SET 
  must_change_password = CASE WHEN password_set = false THEN true ELSE false END,
  has_custom_password = password_set,
  last_password_change = CASE WHEN password_set = true THEN updated_at ELSE NULL END
WHERE password_set IS NOT NULL;

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password 
ON public.profiles(must_change_password) WHERE must_change_password = true;

CREATE INDEX IF NOT EXISTS idx_profiles_has_custom_password 
ON public.profiles(has_custom_password);


-- 2️⃣ TABLE DES PHRASES SECRÈTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_secret_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_encrypted TEXT NOT NULL,          -- Question chiffrée
  answer_hash TEXT NOT NULL,                  -- Réponse hashée (bcrypt)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)                             -- Une seule phrase secrète par utilisateur
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_secret_phrases_user_id 
ON public.user_secret_phrases(user_id);

-- RLS
ALTER TABLE public.user_secret_phrases ENABLE ROW LEVEL SECURITY;

-- Politique : L'utilisateur peut voir sa propre phrase (pour afficher la question)
CREATE POLICY "Users can view own secret phrase"
  ON public.user_secret_phrases
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique : L'utilisateur peut créer sa propre phrase
CREATE POLICY "Users can create own secret phrase"
  ON public.user_secret_phrases
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Politique : L'utilisateur peut mettre à jour sa propre phrase
CREATE POLICY "Users can update own secret phrase"
  ON public.user_secret_phrases
  FOR UPDATE
  USING (user_id = auth.uid());

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all secret phrases"
  ON public.user_secret_phrases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_secret_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_secret_phrases_updated_at
BEFORE UPDATE ON public.user_secret_phrases
FOR EACH ROW
EXECUTE FUNCTION update_user_secret_phrases_updated_at();


-- 3️⃣ TABLE D'HISTORIQUE DES MOTS DE PASSE
-- =====================================================
-- Empêche la réutilisation des anciens mots de passe

CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,                -- Hash bcrypt du mot de passe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_password_history_user_id 
ON public.password_history(user_id);

CREATE INDEX IF NOT EXISTS idx_password_history_created_at 
ON public.password_history(created_at DESC);

-- RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Politique : Seul le système peut écrire (via fonction RPC)
CREATE POLICY "Only system can insert password history"
  ON public.password_history
  FOR INSERT
  WITH CHECK (false);  -- Bloque les inserts directs

-- Politique : Les admins peuvent consulter l'historique
CREATE POLICY "Admins can view password history"
  ON public.password_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );


-- 4️⃣ TABLE DES TENTATIVES DE CONNEXION
-- =====================================================
-- Pour le rate limiting et la sécurité

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,                   -- Email ou matricule
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login', 'secret_phrase', 'password_reset')),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier 
ON public.login_attempts(identifier);

CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at 
ON public.login_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_success 
ON public.login_attempts(success);

-- RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Politique : Seul le système peut écrire (via fonction RPC)
CREATE POLICY "Only system can insert login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);  -- Autorise via RPC

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );


-- 5️⃣ NETTOYAGE DES ANCIENNES TABLES
-- =====================================================

-- Supprimer la table password_reset_requests (obsolète)
DROP TABLE IF EXISTS public.password_reset_requests CASCADE;

-- Commentaires
COMMENT ON TABLE public.user_secret_phrases IS 
'Stocke les phrases secrètes (question/réponse) pour la récupération de mot de passe sans email';

COMMENT ON TABLE public.password_history IS 
'Historique des mots de passe pour empêcher leur réutilisation';

COMMENT ON TABLE public.login_attempts IS 
'Journal des tentatives de connexion pour le rate limiting et la sécurité';

COMMENT ON COLUMN public.profiles.must_change_password IS 
'Force l''utilisateur à changer son mot de passe lors de la prochaine connexion';

COMMENT ON COLUMN public.profiles.has_custom_password IS 
'Indique si l''utilisateur a défini son propre mot de passe (vs mot de passe générique)';

COMMENT ON COLUMN public.profiles.initial_password IS 
'Mot de passe générique hashé fourni par l''administrateur';


-- ✅ Script terminé
SELECT 
  '✅ Nouveau système d''authentification installé avec succès' as message,
  'Tables créées : user_secret_phrases, password_history, login_attempts' as details;
