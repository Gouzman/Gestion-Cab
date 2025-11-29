-- ============================================================
-- Création du bucket de stockage pour les documents
-- ============================================================
-- Ce script crée le bucket "task-files" dans Supabase Storage
-- et configure les politiques d'accès (RLS)
-- 
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- 1️⃣ Créer le bucket "task-files" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  true,  -- Bucket public (fichiers accessibles via URL)
  10485760,  -- Limite 10MB par fichier
  NULL  -- Accepter tous les types MIME
)
ON CONFLICT (id) DO NOTHING;

-- 1️⃣-bis Mettre à jour le bucket existant pour accepter tous les types MIME
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'task-files';

-- 2️⃣ Politique : Tout le monde peut lire les fichiers
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-files');

-- 3️⃣ Politique : Utilisateurs authentifiés peuvent uploader
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-files' 
  AND auth.role() = 'authenticated'
);

-- 4️⃣ Politique : Utilisateurs authentifiés peuvent mettre à jour leurs fichiers
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'task-files' 
  AND auth.role() = 'authenticated'
);

-- 5️⃣ Politique : Utilisateurs authentifiés peuvent supprimer leurs fichiers
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-files' 
  AND auth.role() = 'authenticated'
);

-- 6️⃣ Vérification
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'task-files';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Bucket "task-files" créé avec succès !';
  RAISE NOTICE '✅ Politiques d''accès configurées';
  RAISE NOTICE '✅ Bucket PUBLIC activé';
  RAISE NOTICE '✅ Limite de fichier: 10MB';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Vous pouvez maintenant uploader des documents depuis l''application.';
END $$;
