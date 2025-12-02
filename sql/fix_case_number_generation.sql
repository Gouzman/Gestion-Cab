-- ========================================
-- CORRECTION : Génération Automatique Numéro Dossier
-- Format : YY.NN (Année sur 2 chiffres + Numéro d'ordre)
-- Exemple : 25.01, 25.02, ..., 26.01
-- ========================================

-- 1️⃣ Fonction de génération automatique
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  -- Si un code_dossier est déjà fourni, le conserver
  IF NEW.code_dossier IS NOT NULL AND NEW.code_dossier != '' THEN
    RETURN NEW;
  END IF;
  
  -- Année sur 2 chiffres (ex: 25 pour 2025)
  current_year := TO_CHAR(NOW(), 'YY');
  
  -- Trouver le prochain numéro pour cette année
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code_dossier FROM POSITION('.' IN code_dossier) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM cases
  WHERE code_dossier LIKE current_year || '.%'
    AND code_dossier ~ '^[0-9]{2}\.[0-9]+$'; -- Valider le format
  
  -- Générer le code au format YY.NN (ex: 25.01)
  NEW.code_dossier := current_year || '.' || LPAD(next_number::TEXT, 2, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ Créer le trigger
DROP TRIGGER IF EXISTS trigger_generate_case_number ON cases;
CREATE TRIGGER trigger_generate_case_number
  BEFORE INSERT ON cases
  FOR EACH ROW
  WHEN (NEW.code_dossier IS NULL OR NEW.code_dossier = '')
  EXECUTE FUNCTION generate_case_number();

-- 3️⃣ Ajouter un commentaire explicatif
COMMENT ON FUNCTION generate_case_number() IS 
'Génère automatiquement le numéro de dossier au format YY.NN (année + ordre)';

-- 4️⃣ Test de la fonction
-- Insérer un dossier de test (sera supprimé ensuite)
DO $$
DECLARE
  test_case_id UUID;
  generated_code TEXT;
BEGIN
  -- Créer un dossier test
  INSERT INTO cases (title, client_id, status)
  VALUES ('Test Auto-Numérotation', 
          (SELECT id FROM clients LIMIT 1), 
          'en-cours')
  RETURNING id, code_dossier INTO test_case_id, generated_code;
  
  -- Vérifier le format
  IF generated_code ~ '^[0-9]{2}\.[0-9]{2}$' THEN
    RAISE NOTICE '✅ Test réussi ! Numéro généré : %', generated_code;
  ELSE
    RAISE EXCEPTION '❌ Test échoué ! Format invalide : %', generated_code;
  END IF;
  
  -- Nettoyer
  DELETE FROM cases WHERE id = test_case_id;
  RAISE NOTICE '🧹 Dossier de test supprimé';
END $$;

-- 5️⃣ Afficher un résumé
SELECT 
  '✅ Fonction create_case_number créée' as status,
  'Format: YY.NN (ex: 25.01)' as format,
  'Trigger actif sur INSERT' as trigger_status;
