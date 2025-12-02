-- ========================================
-- FIX : Supprimer le trigger problématique des conventions
-- ========================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_check_convention_expiration ON clients;

-- Supprimer la fonction associée
DROP FUNCTION IF EXISTS check_convention_expiration();

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger et fonction de convention supprimés';
  RAISE NOTICE '   Les alertes d''expiration sont gérées via le ConventionDashboard';
END $$;

SELECT 
  '✅ Fix appliqué' as status,
  'Le trigger problématique a été supprimé' as message;
