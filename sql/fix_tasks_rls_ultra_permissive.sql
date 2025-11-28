-- ============================================
-- FIX IMMÉDIAT - Policies RLS Ultra-Permissives pour tasks
-- Date : 27 novembre 2025
-- Objectif : Débloquer l'insertion/modification des tâches
-- ============================================

-- ⚠️ ATTENTION : Ces policies sont très permissives
-- Elles permettent à tous les utilisateurs authentifiés d'accéder à toutes les tâches
-- À affiner ultérieurement selon vos besoins de sécurité

-- Désactiver temporairement RLS (pour nettoyer les policies)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les policies existantes
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', pol.policyname);
    END LOOP;
END $$;

-- Réactiver RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES ULTRA-PERMISSIVES (tous droits)
-- ============================================

-- INSERT : Tout utilisateur authentifié peut créer n'importe quelle tâche
CREATE POLICY "Enable insert for authenticated users"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT : Tout utilisateur authentifié peut voir toutes les tâches
CREATE POLICY "Enable read access for authenticated users"
ON tasks FOR SELECT
TO authenticated
USING (true);

-- UPDATE : Tout utilisateur authentifié peut modifier toutes les tâches
CREATE POLICY "Enable update for authenticated users"
ON tasks FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE : Tout utilisateur authentifié peut supprimer toutes les tâches
CREATE POLICY "Enable delete for authenticated users"
ON tasks FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Vérification
-- ============================================

-- Vérifier que les 4 policies sont créées
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd;

-- ============================================
-- Note importante
-- ============================================
-- Ces policies donnent accès complet à tous les utilisateurs authentifiés.
-- Pour restreindre l'accès ultérieurement, utilisez le fichier :
-- sql/fix_tasks_rls_policies.sql (version avec permissions granulaires)
