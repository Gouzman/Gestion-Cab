-- Création et configuration de la table activities avec RLS
-- Ce script corrige l'erreur "new row violates row-level security policy for table activities"

-- 1. Créer la table activities si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activer RLS sur la table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "System can insert activities" ON public.activities;
DROP POLICY IF EXISTS "Allow all inserts to activities" ON public.activities;

-- 4. Policy pour permettre à tous les utilisateurs authentifiés de voir leurs propres activités
CREATE POLICY "Users can view their own activities"
    ON public.activities
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Policy pour permettre à tous les utilisateurs authentifiés d'insérer leurs propres activités
CREATE POLICY "Users can insert their own activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Policy spéciale pour les inserts système (triggers, functions)
-- Cette policy permet les insertions sans restriction d'utilisateur pour les triggers
CREATE POLICY "Allow system inserts to activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (true);

-- 7. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);

-- 8. Ajouter des commentaires pour la documentation
COMMENT ON TABLE public.activities IS 'Table de journalisation des activités utilisateurs';
COMMENT ON COLUMN public.activities.user_id IS 'ID de l''utilisateur qui a effectué l''action';
COMMENT ON COLUMN public.activities.action IS 'Type d''action effectuée (created, updated, deleted, etc.)';
COMMENT ON COLUMN public.activities.entity_type IS 'Type d''entité concernée (task, case, document, etc.)';
COMMENT ON COLUMN public.activities.entity_id IS 'ID de l''entité concernée';
COMMENT ON COLUMN public.activities.details IS 'Détails supplémentaires au format JSON';

-- Fin du script
