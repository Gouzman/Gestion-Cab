-- ========================================
-- CORRECTION 2 : Ajout des Champs Juridiques Manquants
-- ========================================

-- 1️⃣ Ajouter les colonnes manquantes
DO $$
BEGIN
  -- Juridiction compétente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'juridiction'
  ) THEN
    ALTER TABLE cases ADD COLUMN juridiction TEXT;
    RAISE NOTICE '✅ Colonne juridiction ajoutée';
  END IF;

  -- Numéro RG (Rôle Général du tribunal)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'numero_rg'
  ) THEN
    ALTER TABLE cases ADD COLUMN numero_rg TEXT;
    RAISE NOTICE '✅ Colonne numero_rg ajoutée';
  END IF;

  -- Type de procédure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'type_procedure'
  ) THEN
    ALTER TABLE cases ADD COLUMN type_procedure TEXT;
    RAISE NOTICE '✅ Colonne type_procedure ajoutée';
  END IF;

  -- Avocat adverse
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'avocat_adverse'
  ) THEN
    ALTER TABLE cases ADD COLUMN avocat_adverse TEXT;
    RAISE NOTICE '✅ Colonne avocat_adverse ajoutée';
  END IF;

  -- Numéro de cabinet d'instruction
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'numero_cabinet_instruction'
  ) THEN
    ALTER TABLE cases ADD COLUMN numero_cabinet_instruction TEXT;
    RAISE NOTICE '✅ Colonne numero_cabinet_instruction ajoutée';
  END IF;
END $$;

-- 2️⃣ Ajouter des commentaires explicatifs
COMMENT ON COLUMN cases.juridiction IS 'Juridiction compétente (ex: Tribunal de Grande Instance de Paris)';
COMMENT ON COLUMN cases.numero_rg IS 'Numéro RG (Rôle Général) attribué par le tribunal';
COMMENT ON COLUMN cases.type_procedure IS 'Type de procédure (référé, fond, appel, cassation)';
COMMENT ON COLUMN cases.avocat_adverse IS 'Nom de l''avocat de la partie adverse';
COMMENT ON COLUMN cases.numero_cabinet_instruction IS 'Numéro du cabinet d''instruction si applicable';

-- 3️⃣ Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cases_juridiction ON cases(juridiction);
CREATE INDEX IF NOT EXISTS idx_cases_numero_rg ON cases(numero_rg);
CREATE INDEX IF NOT EXISTS idx_cases_type_procedure ON cases(type_procedure);

-- 4️⃣ Afficher un résumé
SELECT 
  '✅ Champs juridiques ajoutés' as status,
  COUNT(*) as total_cases,
  COUNT(juridiction) as cases_with_juridiction
FROM cases;
