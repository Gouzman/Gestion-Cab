-- Script SQL pour créer la table des demandes de réinitialisation de mot de passe
-- Cette table permet à l'administrateur de valider manuellement les demandes

-- 1. Créer la table password_reset_requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Créer un index sur l'email pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_email 
ON password_reset_requests(email);

-- 3. Créer un index sur le statut pour filtrer facilement
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status 
ON password_reset_requests(status);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- 5. Politique : Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own reset requests"
  ON password_reset_requests
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- 6. Politique : Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own reset requests"
  ON password_reset_requests
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- 7. Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all reset requests"
  ON password_reset_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. Politique : Les admins peuvent mettre à jour les demandes
CREATE POLICY "Admins can update reset requests"
  ON password_reset_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. Ajouter des commentaires pour la documentation
COMMENT ON TABLE password_reset_requests IS 
'Table pour gérer les demandes de réinitialisation de mot de passe qui nécessitent une validation manuelle par un administrateur';

COMMENT ON COLUMN password_reset_requests.status IS 
'Statut de la demande : pending (en attente), approved (approuvée), rejected (rejetée)';

-- ✅ Script terminé
-- La table password_reset_requests est maintenant disponible
