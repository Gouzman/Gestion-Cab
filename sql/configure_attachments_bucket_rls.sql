-- =====================================================
-- Script: Configuration des Règles RLS pour le Bucket Attachments
-- Description: Règles de sécurité pour le stockage des fichiers
-- Date: 2025-11-11
-- =====================================================

-- ⚠️ IMPORTANT :
-- Ce script doit être exécuté dans Supabase Dashboard > SQL Editor
-- après la création automatique du bucket 'attachments'

-- =====================================================
-- 1. RÈGLE : Lecture publique de tous les fichiers
-- =====================================================
-- Permet à tous les utilisateurs (authentifiés ou non) de lire les fichiers
-- dans le bucket 'attachments' via les URLs publiques

CREATE POLICY IF NOT EXISTS "Public Access to attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'attachments');

-- Vérification
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname = 'Public Access to attachments';

-- =====================================================
-- 2. RÈGLE : Upload restreint aux utilisateurs authentifiés
-- =====================================================
-- Seuls les utilisateurs connectés peuvent uploader des fichiers
-- dans le bucket 'attachments'

CREATE POLICY IF NOT EXISTS "Authenticated users can upload to attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- =====================================================
-- 3. RÈGLE : Mise à jour restreinte aux propriétaires
-- =====================================================
-- Les utilisateurs peuvent uniquement modifier leurs propres fichiers

CREATE POLICY IF NOT EXISTS "Users can update their own files in attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'attachments' AND auth.uid() = owner);

-- =====================================================
-- 4. RÈGLE : Suppression restreinte aux propriétaires
-- =====================================================
-- Les utilisateurs peuvent uniquement supprimer leurs propres fichiers

CREATE POLICY IF NOT EXISTS "Users can delete their own files in attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

-- =====================================================
-- 5. RÈGLE OPTIONNELLE : Admins peuvent tout gérer
-- =====================================================
-- Les utilisateurs avec le rôle 'admin' peuvent gérer tous les fichiers
-- (Décommentez si vous avez une table profiles avec un champ role)

/*
CREATE POLICY IF NOT EXISTS "Admins have full access to attachments"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'attachments' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'attachments' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
*/

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
-- Lister toutes les règles actives pour le bucket 'attachments'

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
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%attachments%'
ORDER BY policyname;

-- =====================================================
-- NOTES ET RECOMMANDATIONS
-- =====================================================

/*
📋 RÉSUMÉ DES RÈGLES :

1. ✅ Lecture publique (SELECT)
   - Tout le monde peut lire les fichiers
   - Nécessaire pour les URLs publiques

2. ✅ Upload authentifié (INSERT)
   - Seuls les utilisateurs connectés peuvent uploader
   - Sécurise contre les uploads anonymes

3. ✅ Modification propriétaire (UPDATE)
   - Chaque utilisateur peut modifier ses fichiers
   - Protection contre les modifications non autorisées

4. ✅ Suppression propriétaire (DELETE)
   - Chaque utilisateur peut supprimer ses fichiers
   - Protection contre les suppressions non autorisées

5. ⚠️ Admin (optionnel)
   - Les admins peuvent tout gérer
   - À activer si vous avez un système de rôles


🔒 SÉCURITÉ :

- Les fichiers sont publiquement lisibles mais protégés en écriture
- Seuls les utilisateurs authentifiés peuvent uploader
- Chaque utilisateur ne peut modifier/supprimer que ses propres fichiers
- Les URLs générées restent publiques et partageables


🚀 APRÈS EXÉCUTION :

1. Tester l'upload d'un fichier (doit fonctionner)
2. Tester l'accès à l'URL publique (doit fonctionner)
3. Vérifier que les utilisateurs non connectés ne peuvent pas uploader
4. Vérifier que les utilisateurs ne peuvent pas supprimer les fichiers des autres


⚠️ EN CAS DE PROBLÈME :

Si les règles RLS bloquent les uploads même pour les utilisateurs authentifiés :

1. Vérifier que le bucket 'attachments' a bien public = true
2. Vérifier que l'utilisateur est correctement authentifié (auth.uid() non null)
3. Vérifier les logs Supabase Dashboard > Logs
4. Désactiver temporairement RLS pour tester :
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   (NE PAS FAIRE EN PRODUCTION)

*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
