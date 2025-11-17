-- ============================================================
-- VÉRIFICATION RAPIDE : Structure de la table tasks_files
-- ============================================================
-- Script de diagnostic pour vérifier la structure de tasks_files
-- À exécuter AVANT le script de correction RLS
-- ============================================================

-- 1. Vérifier que la table existe
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'tasks_files';

-- 2. Afficher toutes les colonnes de la table
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks_files'
ORDER BY ordinal_position;

-- 3. Vérifier spécifiquement la colonne created_by
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks_files'
  AND column_name = 'created_by';

-- 4. Afficher les policies RLS actuelles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks_files';

-- 5. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tasks_files';

-- ============================================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================================

-- ✅ Si la colonne created_by existe :
--    → Passez directement au script fix_tasks_files_rls_final.sql

-- ❌ Si la colonne created_by n'existe PAS :
--    → Exécutez d'abord cette commande :
--
--    ALTER TABLE public.tasks_files 
--    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
--
--    → Puis exécutez fix_tasks_files_rls_final.sql

-- 📊 Si la table n'existe PAS :
--    → La table doit être créée manuellement avec cette structure :
--
--    CREATE TABLE public.tasks_files (
--      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--      task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
--      file_name TEXT NOT NULL,
--      file_url TEXT NOT NULL,
--      file_size BIGINT,
--      file_type TEXT,
--      file_data TEXT,
--      created_at TIMESTAMPTZ DEFAULT NOW(),
--      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
--    );
--
--    CREATE INDEX idx_tasks_files_task_id ON public.tasks_files(task_id);
--    CREATE INDEX idx_tasks_files_created_by ON public.tasks_files(created_by);
--
--    → Puis exécutez fix_tasks_files_rls_final.sql
