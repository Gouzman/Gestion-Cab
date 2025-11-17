-- Script SQL pour créer la table tasks_files
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer la table tasks_files pour stocker les documents numérisés
CREATE TABLE IF NOT EXISTS tasks_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Ajouter des commentaires pour documenter la table
COMMENT ON TABLE tasks_files IS 'Table des fichiers numérisés ou uploadés associés aux tâches';
COMMENT ON COLUMN tasks_files.task_id IS 'ID de la tâche à laquelle le fichier est associé';
COMMENT ON COLUMN tasks_files.file_url IS 'URL ou chemin du fichier dans le storage Supabase';
COMMENT ON COLUMN tasks_files.file_name IS 'Nom original du fichier';
COMMENT ON COLUMN tasks_files.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN tasks_files.file_type IS 'Type MIME du fichier';

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tasks_files_task_id ON tasks_files(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_files_created_at ON tasks_files(created_at);

-- Activer RLS (Row Level Security)
ALTER TABLE tasks_files ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir tous les fichiers (simplifié)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tasks_files' 
        AND policyname = 'Users can view task files'
    ) THEN
        CREATE POLICY "Users can view task files" 
        ON tasks_files FOR SELECT 
        USING (true);
    END IF;
END $$;

-- Politique RLS : les utilisateurs authentifiés peuvent créer des fichiers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tasks_files' 
        AND policyname = 'Users can create task files'
    ) THEN
        CREATE POLICY "Users can create task files" 
        ON tasks_files FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Politique RLS : les utilisateurs peuvent supprimer tous les fichiers (simplifié)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tasks_files' 
        AND policyname = 'Users can delete task files'
    ) THEN
        CREATE POLICY "Users can delete task files" 
        ON tasks_files FOR DELETE 
        USING (true);
    END IF;
END $$;

-- Fonction pour rafraîchir le cache PostgREST
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS void
LANGUAGE sql
SECURITY definer
AS $$ 
  SELECT pg_notify('pgrst', 'reload schema'); 
$$;

-- Donner accès à la fonction
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO anon;

-- Rafraîchir le cache immédiatement
SELECT public.refresh_schema_cache();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Table tasks_files créée avec succès !';
  RAISE NOTICE '✅ Colonnes : id, task_id, file_name, file_url, file_size, file_type, file_data, created_at, created_by';
  RAISE NOTICE '✅ Index créés pour optimiser les performances';
  RAISE NOTICE '✅ RLS activé avec policies de sécurité';
  RAISE NOTICE '✅ Cache Supabase rechargé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Vous pouvez maintenant uploader des fichiers !';
END $$;