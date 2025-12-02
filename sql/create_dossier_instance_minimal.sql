-- Script minimal pour créer la table dossier_instance
-- À exécuter dans Supabase SQL Editor

-- Supprimer la table si elle existe (attention aux données)
-- DROP TABLE IF EXISTS dossier_instance CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS dossier_instance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Type d'instance
  instance_type TEXT NOT NULL CHECK (instance_type IN (
    'premiere_instance',
    'opposition',
    'appel',
    'cassation',
    'revision',
    'tierce_opposition'
  )),
  
  -- Informations juridictionnelles
  juridiction TEXT,
  numero_rg TEXT,
  date_introduction DATE,
  date_jugement DATE,
  
  -- Résultat
  decision TEXT,
  favorable BOOLEAN,
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN (
    'en_cours',
    'gagne',
    'perdu',
    'desistement',
    'transaction'
  )),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_instance_case_id ON dossier_instance(case_id);
CREATE INDEX IF NOT EXISTS idx_instance_type ON dossier_instance(instance_type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_instance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_instance_updated_at ON dossier_instance;
CREATE TRIGGER trigger_update_instance_updated_at
  BEFORE UPDATE ON dossier_instance
  FOR EACH ROW
  EXECUTE FUNCTION update_instance_updated_at();

-- Activer RLS
ALTER TABLE dossier_instance ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users" ON dossier_instance
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users" ON dossier_instance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique : Mise à jour pour tous les utilisateurs authentifiés
CREATE POLICY "Allow update for authenticated users" ON dossier_instance
  FOR UPDATE
  TO authenticated
  USING (true);

-- Politique : Suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users" ON dossier_instance
  FOR DELETE
  TO authenticated
  USING (true);

-- Vérification
SELECT 
  '✅ Table dossier_instance créée avec succès' as status,
  COUNT(*) as nb_instances
FROM dossier_instance;
