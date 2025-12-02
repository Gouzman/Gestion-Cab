-- ========================================
-- PRIORITY 2 : REGROUPEMENT DE DOSSIERS (Chemise à sangle)
-- Article 79 : Plusieurs dossiers peuvent être regroupés
-- ========================================

-- 1️⃣ Ajouter les champs de regroupement à la table cases
DO $$
BEGIN
  -- Groupe de dossiers (chemise à sangle)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'dossier_groupe_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN dossier_groupe_id UUID;
    RAISE NOTICE '✅ Colonne dossier_groupe_id ajoutée';
  END IF;
  
  -- Nom du groupe (ex: "Affaire Martin - Ensemble")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'groupe_nom'
  ) THEN
    ALTER TABLE cases ADD COLUMN groupe_nom TEXT;
    RAISE NOTICE '✅ Colonne groupe_nom ajoutée';
  END IF;
  
  -- Dossier principal du groupe (true pour le dossier "maître")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'is_groupe_principal'
  ) THEN
    ALTER TABLE cases ADD COLUMN is_groupe_principal BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_groupe_principal ajoutée';
  END IF;
END $$;

-- 2️⃣ Ajouter une contrainte de cohérence
-- Si un dossier a un groupe_nom, il doit avoir un dossier_groupe_id ou être principal
ALTER TABLE cases ADD CONSTRAINT check_groupe_coherence 
  CHECK (
    (dossier_groupe_id IS NULL AND groupe_nom IS NULL AND is_groupe_principal = false) OR
    (dossier_groupe_id IS NOT NULL AND groupe_nom IS NOT NULL) OR
    (is_groupe_principal = true AND groupe_nom IS NOT NULL)
  );

-- 3️⃣ Index pour les performances
CREATE INDEX IF NOT EXISTS idx_cases_groupe_id ON cases(dossier_groupe_id);
CREATE INDEX IF NOT EXISTS idx_cases_groupe_principal ON cases(is_groupe_principal) WHERE is_groupe_principal = true;

-- 4️⃣ Commentaires
COMMENT ON COLUMN cases.dossier_groupe_id IS 'ID du dossier principal (chemise à sangle) - NULL si dossier isolé';
COMMENT ON COLUMN cases.groupe_nom IS 'Nom du groupe de dossiers (ex: "Affaire Martin - Ensemble")';
COMMENT ON COLUMN cases.is_groupe_principal IS 'true si c''est le dossier principal du groupe';

-- 5️⃣ Vue pour afficher les groupes de dossiers
CREATE OR REPLACE VIEW v_groupes_dossiers AS
SELECT 
  COALESCE(c.dossier_groupe_id, c.id) as groupe_id,
  c.groupe_nom,
  COUNT(*) as nb_dossiers,
  ARRAY_AGG(c.id ORDER BY c.is_groupe_principal DESC, c.created_at) as dossiers_ids,
  ARRAY_AGG(c.code_dossier ORDER BY c.is_groupe_principal DESC, c.created_at) as dossiers_codes,
  ARRAY_AGG(c.title ORDER BY c.is_groupe_principal DESC, c.created_at) as dossiers_titres,
  (ARRAY_AGG(c.id ORDER BY c.is_groupe_principal DESC, c.created_at) FILTER (WHERE c.is_groupe_principal = true))[1] as dossier_principal_id
FROM cases c
WHERE c.groupe_nom IS NOT NULL OR c.is_groupe_principal = true
GROUP BY COALESCE(c.dossier_groupe_id, c.id), c.groupe_nom;

COMMENT ON VIEW v_groupes_dossiers IS 'Vue des groupes de dossiers (chemises à sangle)';

-- 6️⃣ Fonction pour créer un groupe de dossiers
CREATE OR REPLACE FUNCTION create_dossier_groupe(
  p_groupe_nom TEXT,
  p_dossier_principal_id UUID,
  p_dossiers_lies_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  -- Marquer le dossier principal
  UPDATE cases 
  SET 
    is_groupe_principal = true,
    groupe_nom = p_groupe_nom,
    dossier_groupe_id = NULL
  WHERE id = p_dossier_principal_id;
  
  -- Lier les autres dossiers
  IF p_dossiers_lies_ids IS NOT NULL AND array_length(p_dossiers_lies_ids, 1) > 0 THEN
    FOREACH v_dossier_id IN ARRAY p_dossiers_lies_ids
    LOOP
      UPDATE cases
      SET 
        dossier_groupe_id = p_dossier_principal_id,
        groupe_nom = p_groupe_nom,
        is_groupe_principal = false
      WHERE id = v_dossier_id;
    END LOOP;
  END IF;
  
  RETURN p_dossier_principal_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_dossier_groupe IS 'Crée un groupe de dossiers (chemise à sangle)';

-- 7️⃣ Fonction pour dissoudre un groupe
CREATE OR REPLACE FUNCTION dissolve_dossier_groupe(p_groupe_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_nb_dossiers INTEGER;
BEGIN
  -- Compter les dossiers
  SELECT COUNT(*) INTO v_nb_dossiers
  FROM cases
  WHERE id = p_groupe_id OR dossier_groupe_id = p_groupe_id;
  
  -- Dissoudre le groupe
  UPDATE cases
  SET 
    dossier_groupe_id = NULL,
    groupe_nom = NULL,
    is_groupe_principal = false
  WHERE id = p_groupe_id OR dossier_groupe_id = p_groupe_id;
  
  RETURN v_nb_dossiers;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION dissolve_dossier_groupe IS 'Dissout un groupe de dossiers';

-- 8️⃣ Test : Créer un groupe de dossiers de test
DO $$
DECLARE
  test_case_1_id UUID;
  test_case_2_id UUID;
  test_groupe_id UUID;
BEGIN
  -- Récupérer 2 dossiers existants
  SELECT id INTO test_case_1_id FROM cases ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO test_case_2_id FROM cases ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  
  IF test_case_1_id IS NOT NULL AND test_case_2_id IS NOT NULL THEN
    -- Créer un groupe de test
    test_groupe_id := create_dossier_groupe(
      'Groupe Test - Affaire Complexe',
      test_case_1_id,
      ARRAY[test_case_2_id]
    );
    
    RAISE NOTICE '✅ Groupe de test créé avec dossier principal: %', test_groupe_id;
    RAISE NOTICE '   - Dossier principal: %', test_case_1_id;
    RAISE NOTICE '   - Dossier lié: %', test_case_2_id;
    
    -- Dissoudre le groupe de test
    PERFORM dissolve_dossier_groupe(test_groupe_id);
    RAISE NOTICE '🧹 Groupe de test dissous';
  ELSE
    RAISE NOTICE '⚠️ Pas assez de dossiers pour le test (besoin de 2 minimum)';
  END IF;
END $$;

-- 9️⃣ Résumé
SELECT 
  '✅ Système de regroupement activé' as status,
  'Colonnes: dossier_groupe_id, groupe_nom, is_groupe_principal' as colonnes,
  'Fonctions: create_dossier_groupe(), dissolve_dossier_groupe()' as fonctions,
  'Vue: v_groupes_dossiers' as vue;
