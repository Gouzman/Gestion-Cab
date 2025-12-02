-- ========================================
-- DIAGNOSTIC ET FIX : Erreurs Foreign Key activities
-- ========================================

-- 1️⃣ Supprimer le trigger de convention problématique
DROP TRIGGER IF EXISTS trigger_check_convention_expiration ON clients;
DROP FUNCTION IF EXISTS check_convention_expiration();

RAISE NOTICE '✅ Étape 1/4 : Trigger convention supprimé';

-- 2️⃣ Vérifier les triggers existants sur la table clients
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Triggers actifs sur la table clients :';
  FOR trigger_rec IN 
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'clients'
  LOOP
    RAISE NOTICE '  - % (%)', trigger_rec.trigger_name, trigger_rec.event_manipulation;
  END LOOP;
END $$;

-- 3️⃣ Vérifier les contraintes de clé étrangère sur activities
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Contraintes FK sur activities :';
  FOR constraint_rec IN 
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = 'activities'
  LOOP
    RAISE NOTICE '  - %', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- 4️⃣ Vérifier s'il y a des enregistrements activities avec user_id invalide
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM activities a
  LEFT JOIN profiles p ON a.user_id = p.id
  WHERE a.user_id IS NOT NULL AND p.id IS NULL;
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Attention : % enregistrements activities avec user_id invalide', invalid_count;
    RAISE NOTICE '   Ces enregistrements doivent être corrigés ou supprimés';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Aucun enregistrement activities avec user_id invalide';
  END IF;
END $$;

-- 5️⃣ Option : Nettoyer les activities orphelines (DÉCOMMENTER SI NÉCESSAIRE)
-- DELETE FROM activities 
-- WHERE user_id IS NOT NULL 
-- AND user_id NOT IN (SELECT id FROM profiles);

-- 6️⃣ Option : Rendre la FK nullable temporairement (DÉCOMMENTER SI NÉCESSAIRE)
-- ALTER TABLE activities ALTER COLUMN user_id DROP NOT NULL;

RAISE NOTICE '';
RAISE NOTICE '✅ Diagnostic terminé';
RAISE NOTICE '';
RAISE NOTICE '📝 Actions recommandées :';
RAISE NOTICE '   1. Si des activities orphelines existent, les supprimer (décommenter ligne 57)';
RAISE NOTICE '   2. Vérifier que tous les triggers n''insèrent plus dans activities';
RAISE NOTICE '   3. Les alertes convention sont maintenant gérées via ConventionDashboard';

SELECT 
  '✅ Diagnostic et fix appliqué' as status,
  'Vérifiez les notices ci-dessus' as message;
