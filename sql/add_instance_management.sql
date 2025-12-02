-- ========================================
-- PRIORITY 2 : GESTION DES INSTANCES JURIDIQUES
-- Article 77 : Une instance peut connaître plusieurs degrés
-- ========================================

-- 1️⃣ Créer la table dossier_instance
CREATE TABLE IF NOT EXISTS dossier_instance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Type d'instance
  instance_type TEXT NOT NULL CHECK (instance_type IN (
    'premiere_instance',  -- Première instance (tribunal de première instance)
    'opposition',         -- Opposition à une décision
    'appel',             -- Appel devant la Cour d'Appel
    'cassation',         -- Pourvoi en cassation
    'revision',          -- Demande de révision
    'tierce_opposition'  -- Tierce opposition
  )),
  
  -- Informations juridictionnelles
  juridiction TEXT,                    -- Juridiction qui traite cette instance
  numero_rg TEXT,                      -- Numéro RG spécifique à cette instance
  date_introduction DATE,              -- Date d'introduction de l'instance
  date_jugement DATE,                  -- Date du jugement/décision
  
  -- Résultat
  decision TEXT,                       -- Résumé de la décision
  favorable BOOLEAN,                   -- Issue favorable (true) ou défavorable (false)
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
  
  -- Ordre des instances (1 = première instance, 2 = appel, etc.)
  ordre INTEGER DEFAULT 1,
  
  CONSTRAINT unique_case_instance UNIQUE (case_id, instance_type)
);

-- 2️⃣ Index pour les performances
CREATE INDEX IF NOT EXISTS idx_instance_case_id ON dossier_instance(case_id);
CREATE INDEX IF NOT EXISTS idx_instance_type ON dossier_instance(instance_type);
CREATE INDEX IF NOT EXISTS idx_instance_statut ON dossier_instance(statut);
CREATE INDEX IF NOT EXISTS idx_instance_date_jugement ON dossier_instance(date_jugement);

-- 3️⃣ Commentaires
COMMENT ON TABLE dossier_instance IS 'Gestion des différentes instances d''un dossier (première instance, appel, cassation)';
COMMENT ON COLUMN dossier_instance.instance_type IS 'Type d''instance juridique';
COMMENT ON COLUMN dossier_instance.ordre IS 'Ordre chronologique des instances (1, 2, 3...)';
COMMENT ON COLUMN dossier_instance.favorable IS 'Issue favorable pour le client';

-- 4️⃣ Trigger pour updated_at
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

-- 5️⃣ Vue pour afficher les dossiers avec leur historique d'instances
CREATE OR REPLACE VIEW v_cases_with_instances AS
SELECT 
  c.id,
  c.code_dossier,
  c.title,
  c.client_id,
  c.status as case_status,
  COUNT(di.id) as nb_instances,
  ARRAY_AGG(di.instance_type ORDER BY di.ordre) FILTER (WHERE di.id IS NOT NULL) as instances_types,
  ARRAY_AGG(di.statut ORDER BY di.ordre) FILTER (WHERE di.id IS NOT NULL) as instances_statuts
FROM cases c
LEFT JOIN dossier_instance di ON di.case_id = c.id
GROUP BY c.id, c.code_dossier, c.title, c.client_id, c.status;

COMMENT ON VIEW v_cases_with_instances IS 'Vue des dossiers avec leur historique d''instances';

-- 6️⃣ Test : Créer une instance de test
DO $$
DECLARE
  test_case_id UUID;
  test_instance_id UUID;
BEGIN
  -- Récupérer un dossier existant
  SELECT id INTO test_case_id FROM cases LIMIT 1;
  
  IF test_case_id IS NOT NULL THEN
    -- Créer une instance de test
    INSERT INTO dossier_instance (
      case_id,
      instance_type,
      juridiction,
      numero_rg,
      date_introduction,
      statut,
      ordre
    ) VALUES (
      test_case_id,
      'premiere_instance',
      'TPI Lomé',
      'RG-TEST-2025/001',
      CURRENT_DATE,
      'en_cours',
      1
    ) RETURNING id INTO test_instance_id;
    
    RAISE NOTICE '✅ Instance de test créée avec ID: %', test_instance_id;
    
    -- Nettoyer
    DELETE FROM dossier_instance WHERE id = test_instance_id;
    RAISE NOTICE '🧹 Instance de test supprimée';
  ELSE
    RAISE NOTICE '⚠️ Aucun dossier trouvé pour le test';
  END IF;
END $$;

-- 7️⃣ Résumé
SELECT 
  '✅ Table dossier_instance créée' as status,
  'Types: premiere_instance, opposition, appel, cassation, revision, tierce_opposition' as types_disponibles,
  'Vue v_cases_with_instances créée' as vue;
