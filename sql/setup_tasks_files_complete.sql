-- =============================================
-- Script de création complète pour tasks_files
-- =============================================

-- 1. Créer la table tasks_files si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.tasks_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_files_task_id ON public.tasks_files(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_files_created_by ON public.tasks_files(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_files_created_at ON public.tasks_files(created_at DESC);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "tasks_files_select" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_insert" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_update" ON public.tasks_files;
DROP POLICY IF NOT EXISTS "tasks_files_delete" ON public.tasks_files;

-- 5. Créer les politiques RLS
-- Lecture : tous les utilisateurs authentifiés peuvent voir les fichiers
CREATE POLICY "tasks_files_select" 
ON public.tasks_files
FOR SELECT 
TO authenticated 
USING (true);

-- Insertion : utilisateurs authentifiés peuvent ajouter des fichiers
CREATE POLICY "tasks_files_insert" 
ON public.tasks_files
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Mise à jour : seul le créateur peut modifier
CREATE POLICY "tasks_files_update" 
ON public.tasks_files
FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid());

-- Suppression : seul le créateur peut supprimer
CREATE POLICY "tasks_files_delete" 
ON public.tasks_files
FOR DELETE 
TO authenticated 
USING (created_by = auth.uid());

-- 6. Ajouter un trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_files_updated_at ON public.tasks_files;
CREATE TRIGGER update_tasks_files_updated_at
BEFORE UPDATE ON public.tasks_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Accorder les permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks_files TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tasks_files_id_seq TO authenticated;

-- Vérification finale
SELECT 'Table tasks_files créée avec succès!' AS status;
SELECT COUNT(*) AS nombre_de_fichiers FROM public.tasks_files;
