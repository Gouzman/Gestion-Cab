-- ========================================
-- SUPPRESSION PRIORITÉ 2 - NETTOYAGE COMPLET
-- Date : 2 décembre 2025
-- Description : Supprime tout ce qui concerne :
--   - Attribution des numéros (workflow)
--   - Étiquettes de chemises
--   - Numéro cabinet d'instruction
-- ========================================

-- ========================================
-- 1️⃣ SUPPRIMER LES VUES
-- ========================================

DROP VIEW IF EXISTS v_workflow_historique CASCADE;
DROP VIEW IF EXISTS v_workflow_en_attente CASCADE;

-- ========================================
-- 2️⃣ SUPPRIMER LES FONCTIONS
-- ========================================

DROP FUNCTION IF EXISTS demander_attribution_numeros(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS traiter_attribution_numeros(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generer_donnees_etiquette(UUID) CASCADE;

-- ========================================
-- 3️⃣ SUPPRIMER LES TABLES
-- ========================================

DROP TABLE IF EXISTS workflow_attribution_numeros CASCADE;
DROP TABLE IF EXISTS modeles_etiquettes CASCADE;

-- ========================================
-- 4️⃣ SUPPRIMER LES COLONNES numero_cabinet_instruction
-- ========================================

ALTER TABLE cases DROP COLUMN IF EXISTS numero_cabinet_instruction;
ALTER TABLE dossier_instance DROP COLUMN IF EXISTS numero_cabinet_instruction;

-- ========================================
-- 5️⃣ SUPPRIMER LES INDEX
-- ========================================

DROP INDEX IF EXISTS idx_cases_numero_cabinet;
DROP INDEX IF EXISTS idx_dossier_instance_numero_cabinet;
DROP INDEX IF EXISTS idx_workflow_case_id;
DROP INDEX IF EXISTS idx_workflow_statut;
DROP INDEX IF EXISTS idx_workflow_demande_par;
DROP INDEX IF EXISTS idx_workflow_traite_par;
DROP INDEX IF EXISTS idx_modeles_type;

-- ========================================
-- 6️⃣ VÉRIFICATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Éléments supprimés :';
  RAISE NOTICE '  ✓ Table workflow_attribution_numeros';
  RAISE NOTICE '  ✓ Table modeles_etiquettes';
  RAISE NOTICE '  ✓ Colonne numero_cabinet_instruction (cases)';
  RAISE NOTICE '  ✓ Colonne numero_cabinet_instruction (dossier_instance)';
  RAISE NOTICE '  ✓ Toutes les fonctions et vues associées';
  RAISE NOTICE '  ✓ Tous les index associés';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Fonctionnalités conservées :';
  RAISE NOTICE '  ✓ Auto-génération code_dossier (YY.NN)';
  RAISE NOTICE '  ✓ Chemises de dossiers (regroupement)';
  RAISE NOTICE '  ✓ Avis juridiques annuels';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Aucun impact sur les fonctionnalités existantes';
  RAISE NOTICE '';
END $$;

-- Vérifier qu'il ne reste rien
SELECT 
  '✅ Vérification finale' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('workflow_attribution_numeros', 'modeles_etiquettes')) as tables_restantes,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name IN ('cases', 'dossier_instance') 
   AND column_name = 'numero_cabinet_instruction') as colonnes_restantes,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_name IN ('demander_attribution_numeros', 'traiter_attribution_numeros', 'generer_donnees_etiquette')) as fonctions_restantes;
