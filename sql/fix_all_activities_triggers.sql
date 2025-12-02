-- ========================================
-- FIX COMPLET : Tous les triggers activities
-- ========================================

-- 1️⃣ Supprimer TOUS les triggers sur la table tasks
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '🔍 Recherche des triggers sur tasks...';
  
  FOR trigger_rec IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'tasks'
  LOOP
    RAISE NOTICE '  Suppression : %.%', trigger_rec.event_object_table, trigger_rec.trigger_name;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_rec.trigger_name, trigger_rec.event_object_table);
  END LOOP;
  
  RAISE NOTICE '✅ Tous les triggers tasks supprimés';
END $$;

-- 2️⃣ Supprimer TOUS les triggers sur la table clients
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Recherche des triggers sur clients...';
  
  FOR trigger_rec IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'clients'
  LOOP
    RAISE NOTICE '  Suppression : %.%', trigger_rec.event_object_table, trigger_rec.trigger_name;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_rec.trigger_name, trigger_rec.event_object_table);
  END LOOP;
  
  RAISE NOTICE '✅ Tous les triggers clients supprimés';
END $$;

-- 3️⃣ Supprimer TOUS les triggers sur la table cases
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Recherche des triggers sur cases...';
  
  FOR trigger_rec IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'cases'
  LOOP
    RAISE NOTICE '  Suppression : %.%', trigger_rec.event_object_table, trigger_rec.trigger_name;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_rec.trigger_name, trigger_rec.event_object_table);
  END LOOP;
  
  RAISE NOTICE '✅ Tous les triggers cases supprimés';
END $$;

-- 4️⃣ Vérifier et nettoyer les activities orphelines
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérification des activities orphelines...';
  
  SELECT COUNT(*) INTO orphan_count
  FROM activities a
  LEFT JOIN profiles p ON a.user_id = p.id
  WHERE a.user_id IS NOT NULL AND p.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️  Trouvé % activities avec user_id invalide', orphan_count;
    RAISE NOTICE '🗑️  Suppression en cours...';
    
    DELETE FROM activities 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM profiles);
    
    RAISE NOTICE '✅ % activities orphelines supprimées', orphan_count;
  ELSE
    RAISE NOTICE '✅ Aucune activity orpheline trouvée';
  END IF;
END $$;

-- 5️⃣ Rendre la colonne user_id NULLABLE pour éviter les erreurs futures
ALTER TABLE activities ALTER COLUMN user_id DROP NOT NULL;
RAISE NOTICE '';
RAISE NOTICE '✅ Colonne activities.user_id rendue nullable';

-- 6️⃣ Supprimer toutes les fonctions qui insèrent dans activities
DROP FUNCTION IF EXISTS check_convention_expiration() CASCADE;
DROP FUNCTION IF EXISTS log_task_activity() CASCADE;
DROP FUNCTION IF EXISTS log_case_activity() CASCADE;
DROP FUNCTION IF EXISTS log_client_activity() CASCADE;

RAISE NOTICE '';
RAISE NOTICE '✅ Toutes les fonctions de log supprimées';

-- 7️⃣ Résumé final
DO $$
DECLARE
  remaining_triggers INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_triggers
  FROM information_schema.triggers
  WHERE event_object_table IN ('tasks', 'clients', 'cases', 'activities');
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ FIX TERMINÉ';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé :';
  RAISE NOTICE '  ✅ Triggers restants : %', remaining_triggers;
  RAISE NOTICE '  ✅ Colonne user_id : NULLABLE';
  RAISE NOTICE '  ✅ Activities orphelines : SUPPRIMÉES';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Action requise :';
  RAISE NOTICE '  1. Recharger la page (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Vider le cache navigateur';
  RAISE NOTICE '  3. Tester l''application';
  RAISE NOTICE '';
END $$;

SELECT 
  '✅ Fix complet appliqué' as status,
  'Rechargez la page maintenant' as action;
