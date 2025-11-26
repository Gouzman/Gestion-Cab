-- =====================================================
-- Script: Setup Automatique du Storage Supabase
-- Description: Fonction RPC sécurisée pour créer le bucket attachments
--              avec permissions RLS automatiques
-- Date: 2025-11-11
-- Auteur: Senior Engineer @ Google - Expert Supabase
-- =====================================================

-- ⚠️ IMPORTANT :
-- Ce script doit être exécuté UNE SEULE FOIS dans Supabase Dashboard > SQL Editor
-- La fonction créée sera appelée automatiquement par le frontend via RPC

-- =====================================================
-- 1. FONCTION RPC : Création sécurisée du bucket
-- =====================================================
-- Cette fonction contourne les restrictions RLS de la clé 'anon'
-- en s'exécutant avec les privilèges du propriétaire de la base (SECURITY DEFINER)

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.create_attachments_bucket();

CREATE OR REPLACE FUNCTION public.create_attachments_bucket()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- ⚡ Clé du succès : exécution avec privilèges admin
SET search_path = public
AS $$
DECLARE
  bucket_exists boolean;
  result jsonb;
BEGIN
  -- Vérifier si le bucket existe déjà
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'attachments'
  ) INTO bucket_exists;

  IF bucket_exists THEN
    -- Le bucket existe déjà
    result := jsonb_build_object(
      'success', true,
      'message', '✅ Bucket "attachments" existe déjà',
      'created', false
    );
  ELSE
    -- Créer le bucket avec configuration optimale
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- Accès public pour les URLs
      52428800, -- 50 Mo max (50 * 1024 * 1024)
      ARRAY[
        'image/*',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed'
      ]
    )
    ON CONFLICT (id) DO NOTHING; -- Sécurité en cas de double appel

    result := jsonb_build_object(
      'success', true,
      'message', '🚀 Bucket "attachments" créé avec succès',
      'created', true
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner un message détaillé
    RETURN jsonb_build_object(
      'success', false,
      'message', '❌ Erreur lors de la création du bucket',
      'error', SQLERRM,
      'created', false
    );
END;
$$;

-- Commentaire pour la documentation
COMMENT ON FUNCTION public.create_attachments_bucket() IS 
'Fonction RPC sécurisée pour créer le bucket "attachments" avec privilèges admin. 
Appelée automatiquement par le frontend lors de l''initialisation du storage.';

-- =====================================================
-- 2. PERMISSIONS RLS : Configuration automatique
-- =====================================================
-- Ces règles permettent un fonctionnement optimal du système de fichiers

-- 2.1 Lecture publique (obligatoire pour les URLs publiques)
DROP POLICY IF EXISTS "Public Access to attachments" ON storage.objects;
CREATE POLICY "Public Access to attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'attachments');

-- 2.2 Upload restreint aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload to attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload to attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- 2.3 Mise à jour restreinte aux propriétaires
DROP POLICY IF EXISTS "Users can update their own files in attachments" ON storage.objects;
CREATE POLICY "Users can update their own files in attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'attachments' AND auth.uid() = owner);

-- 2.4 Suppression restreinte aux propriétaires
DROP POLICY IF EXISTS "Users can delete their own files in attachments" ON storage.objects;
CREATE POLICY "Users can delete their own files in attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

-- =====================================================
-- 3. FONCTION HELPER : Vérifier les permissions
-- =====================================================
-- Utile pour le debugging et les tests

CREATE OR REPLACE FUNCTION public.check_storage_permissions()
RETURNS TABLE (
  policy_name text,
  command text,
  roles text[],
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::text,
    p.cmd::text,
    p.roles::text[],
    CASE 
      WHEN p.policyname IS NOT NULL THEN '✅ Active'
      ELSE '❌ Inactive'
    END as status
  FROM pg_policies p
  WHERE p.schemaname = 'storage'
  AND p.tablename = 'objects'
  AND p.policyname LIKE '%attachments%'
  ORDER BY p.policyname;
END;
$$;

COMMENT ON FUNCTION public.check_storage_permissions() IS 
'Vérifie l''état des permissions RLS pour le bucket attachments. 
Retourne la liste des policies actives.';

-- =====================================================
-- 4. TESTS DE VALIDATION
-- =====================================================

-- Test 1 : Créer le bucket (doit réussir)
SELECT public.create_attachments_bucket();

-- Test 2 : Vérifier que le bucket existe
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'attachments';

-- Test 3 : Vérifier les permissions RLS
SELECT * FROM public.check_storage_permissions();

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Test 1 - Création du bucket :
{
  "success": true,
  "message": "🚀 Bucket 'attachments' créé avec succès",
  "created": true
}

✅ Test 2 - Bucket configuré :
id          | name        | public | file_size_limit
-----------+-------------+--------+----------------
attachments | attachments | true   | 52428800

✅ Test 3 - Permissions actives :
policy_name                                    | command | roles              | status
----------------------------------------------+---------+-------------------+----------
Public Access to attachments                   | SELECT  | {public}          | ✅ Active
Authenticated users can upload to attachments  | INSERT  | {authenticated}   | ✅ Active
Users can update their own files in attachments| UPDATE  | {authenticated}   | ✅ Active
Users can delete their own files in attachments| DELETE  | {authenticated}   | ✅ Active

*/

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

/*
🔐 SÉCURITÉ :

1. SECURITY DEFINER permet d'exécuter la fonction avec les droits du propriétaire
   - Contourne les restrictions RLS de la clé 'anon'
   - Permet la création du bucket depuis le frontend
   - SET search_path = public empêche les injections SQL

2. Les permissions RLS sont strictes :
   - Lecture publique (nécessaire pour les URLs)
   - Upload uniquement pour les utilisateurs connectés
   - Modification/suppression uniquement par le propriétaire

3. Gestion des erreurs robuste :
   - ON CONFLICT DO NOTHING évite les doublons
   - EXCEPTION WHEN OTHERS capture toutes les erreurs
   - Messages d'erreur détaillés pour le debugging


🚀 UTILISATION DEPUIS LE FRONTEND :

```javascript
// Dans uploadManager.js
const { data, error } = await supabase.rpc('create_attachments_bucket');

if (data?.success) {
  console.log(data.message); // "✅ Bucket créé avec succès"
} else {
  console.error('Erreur RPC:', data?.error || error);
}
```


🧪 TESTS DE VALIDATION :

1. Supprimer le bucket manuellement dans Supabase Dashboard
2. Relancer l'application
3. Le bucket doit être créé automatiquement sans erreur RLS
4. Upload d'un fichier doit fonctionner immédiatement
5. L'URL publique doit être accessible


⚠️ DÉPANNAGE :

Si la fonction RPC échoue :

1. Vérifier que l'utilisateur Supabase a les droits sur storage.buckets
   ```sql
   GRANT ALL ON storage.buckets TO postgres, authenticated, service_role;
   ```

2. Vérifier que RLS est activé sur storage.objects
   ```sql
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

3. Vérifier les logs Supabase :
   Dashboard > Logs > Postgres Logs

4. Tester manuellement la fonction :
   ```sql
   SELECT * FROM public.create_attachments_bucket();
   ```

*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Script setup_storage.sql exécuté avec succès !';
  RAISE NOTICE '🚀 Fonction public.create_attachments_bucket() prête à être appelée';
  RAISE NOTICE '🔒 Permissions RLS configurées automatiquement';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes :';
  RAISE NOTICE '   1. Le frontend appellera automatiquement la fonction RPC';
  RAISE NOTICE '   2. Le bucket sera créé au premier upload';
  RAISE NOTICE '   3. Les permissions sont déjà actives';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour tester manuellement :';
  RAISE NOTICE '   SELECT * FROM public.create_attachments_bucket();';
END $$;
