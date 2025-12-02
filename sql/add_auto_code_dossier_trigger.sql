-- ========================================
-- TRIGGER AUTOMATIQUE - NUMÉRO DOSSIER (YY.NN)
-- Date : 2 décembre 2025
-- Description : Génération automatique du code_dossier au format YY.NN
--               YY = Année sur 2 chiffres (25 pour 2025)
--               NN = Numéro d'ordre pour cette année (01, 02, 03...)
-- ========================================

-- 1️⃣ Fonction pour générer automatiquement le code_dossier
CREATE OR REPLACE FUNCTION generate_code_dossier()
RETURNS TRIGGER AS $$
DECLARE
  year_code TEXT;
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Si un code_dossier est déjà fourni, ne pas le modifier
  IF NEW.code_dossier IS NOT NULL AND NEW.code_dossier != '' THEN
    RETURN NEW;
  END IF;
  
  -- Extraire les 2 derniers chiffres de l'année courante
  year_code := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Trouver le prochain numéro pour cette année
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code_dossier FROM POSITION('.' IN code_dossier) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM cases
  WHERE code_dossier LIKE year_code || '.%'
    AND code_dossier ~ '^[0-9]{2}\.[0-9]+$'; -- S'assurer que le format est correct
  
  -- Générer le code au format YY.NN
  new_code := year_code || '.' || LPAD(next_number::TEXT, 2, '0');
  
  -- Assigner le nouveau code
  NEW.code_dossier := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ Créer le trigger
DROP TRIGGER IF EXISTS trigger_generate_code_dossier ON cases;
CREATE TRIGGER trigger_generate_code_dossier
  BEFORE INSERT ON cases
  FOR EACH ROW
  WHEN (NEW.code_dossier IS NULL OR NEW.code_dossier = '')
  EXECUTE FUNCTION generate_code_dossier();

-- 3️⃣ Commentaires
COMMENT ON FUNCTION generate_code_dossier() IS 'Génère automatiquement le code_dossier au format YY.NN (année + ordre)';

-- 4️⃣ Test du trigger
DO $$
DECLARE
  test_case_id UUID;
  test_client_id UUID;
  generated_code TEXT;
BEGIN
  -- Récupérer un client existant pour le test
  SELECT id INTO test_client_id FROM clients LIMIT 1;
  
  IF test_client_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucun client trouvé pour le test. Créez d''abord un client.';
  ELSE
    -- Insérer un dossier de test sans code_dossier
    INSERT INTO cases (title, client_id, status, created_by)
    VALUES (
      '🧪 TEST - Code auto',
      test_client_id,
      'en-cours',
      (SELECT id FROM auth.users LIMIT 1)
    )
    RETURNING id, code_dossier INTO test_case_id, generated_code;
    
    RAISE NOTICE '✅ Test réussi ! Code généré : %', generated_code;
    RAISE NOTICE 'Format attendu : %.01, %.02, etc. (année courante)', TO_CHAR(CURRENT_DATE, 'YY'), TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Nettoyer le test
    DELETE FROM cases WHERE id = test_case_id;
    RAISE NOTICE '🧹 Dossier de test supprimé';
  END IF;
END $$;

-- 5️⃣ Vérification
SELECT 
  '✅ Trigger configuré' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'cases'
  AND trigger_name = 'trigger_generate_code_dossier';

-- 6️⃣ Instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TRIGGER CODE_DOSSIER INSTALLÉ AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 FONCTIONNEMENT :';
  RAISE NOTICE '   • Génération automatique si code_dossier vide ou NULL';
  RAISE NOTICE '   • Format : YY.NN (ex: 25.01 pour 2025, dossier #1)';
  RAISE NOTICE '   • Numérotation par année (recommence à .01 chaque année)';
  RAISE NOTICE '   • Possibilité de saisie manuelle (sera respectée)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST :';
  RAISE NOTICE '   Créez un nouveau dossier sans remplir "Réf dossier"';
  RAISE NOTICE '   → Le code sera généré automatiquement';
  RAISE NOTICE '';
  RAISE NOTICE '✏️ SAISIE MANUELLE :';
  RAISE NOTICE '   Remplissez "Réf dossier" avec votre propre code';
  RAISE NOTICE '   → Le code saisi sera conservé';
  RAISE NOTICE '';
END $$;
