-- ========================================
-- PRIORITY 2 : GESTION DES INSTANCES JURIDIQUES (Version Simple)
-- Article 77 : Une instance peut connaître plusieurs degrés
-- ========================================

-- 1️⃣ Créer la table dossier_instance
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ordre des instances
  ordre INTEGER DEFAULT 1,
  
  CONSTRAINT unique_case_instance UNIQUE (case_id, instance_type)
);

-- 2️⃣ Index
CREATE INDEX IF NOT EXISTS idx_instance_case_id ON dossier_instance(case_id);
CREATE INDEX IF NOT EXISTS idx_instance_type ON dossier_instance(instance_type);

-- 3️⃣ Commentaires
COMMENT ON TABLE dossier_instance IS 'Gestion des différentes instances d''un dossier';

-- 4️⃣ Trigger updated_at
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

-- 5️⃣ Résumé
SELECT 
  '✅ Table dossier_instance créée' as status,
  COUNT(*) as nb_instances
FROM dossier_instance;
