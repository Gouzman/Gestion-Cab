-- CORRECTION RAPIDE: Erreur RLS sur la table activities
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- Solution 1: Désactiver temporairement RLS sur activities (RAPIDE mais moins sécurisé)
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;

-- OU

-- Solution 2: Créer une policy permissive pour tous les inserts (RECOMMANDÉ)
-- Étape 1: Activer RLS si pas déjà fait
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer les policies restrictives existantes
DROP POLICY IF EXISTS "Allow all inserts to activities" ON public.activities;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.activities;

-- Étape 3: Créer une policy permissive pour les inserts
CREATE POLICY "Allow all inserts to activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (true);

-- Étape 4: Policy pour lecture (optionnelle)
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities"
    ON public.activities
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (function = 'Gerant' OR function = 'Associe Emerite')
        )
    );

-- Vérification: Afficher les policies actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'activities';

-- Note: Après avoir exécuté ce script, essayez de créer une tâche à nouveau.
-- L'erreur "new row violates row-level security policy" devrait disparaître.
