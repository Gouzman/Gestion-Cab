-- ========================================
-- FIX RAPIDE : Erreur 409 activities
-- ========================================
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Supprimer tous les triggers problématiques
DROP TRIGGER IF EXISTS trigger_check_convention_expiration ON clients CASCADE;
DROP TRIGGER IF EXISTS trigger_log_task_activity ON tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_log_case_activity ON cases CASCADE;
DROP TRIGGER IF EXISTS trigger_log_client_activity ON clients CASCADE;

-- 2. Supprimer les fonctions associées
DROP FUNCTION IF EXISTS check_convention_expiration() CASCADE;
DROP FUNCTION IF EXISTS log_task_activity() CASCADE;
DROP FUNCTION IF EXISTS log_case_activity() CASCADE;
DROP FUNCTION IF EXISTS log_client_activity() CASCADE;

-- 3. Nettoyer les activities orphelines
DELETE FROM activities 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);

-- 4. Rendre user_id nullable
ALTER TABLE activities ALTER COLUMN user_id DROP NOT NULL;

-- Confirmation
SELECT '✅ Fix appliqué - Rechargez la page (Ctrl+Shift+R)' as message;
