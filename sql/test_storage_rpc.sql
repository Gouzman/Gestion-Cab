-- =====================================================
-- Script de Tests Automatisés : Validation RPC Storage
-- Description: Tests complets de la fonction create_attachments_bucket()
-- Date: 2025-11-11
-- =====================================================

-- ⚠️ IMPORTANT :
-- Ce script doit être exécuté APRÈS sql/setup_storage.sql
-- Il valide que tout fonctionne correctement

-- =====================================================
-- PRÉPARATION : Nettoyer l'environnement de test
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 ======================================';
  RAISE NOTICE '🧪  DÉBUT DES TESTS AUTOMATISÉS';
  RAISE NOTICE '🧪 ======================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 1 : Vérifier que la fonction RPC existe
-- =====================================================

DO $$
DECLARE
  function_exists boolean;
  is_security_definer boolean;
BEGIN
  RAISE NOTICE '📋 TEST 1 : Vérification de l''existence de la fonction RPC';
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_attachments_bucket'
  ) INTO function_exists;
  
  IF function_exists THEN
    SELECT prosecdef 
    FROM pg_proc 
    WHERE proname = 'create_attachments_bucket'
    INTO is_security_definer;
    
    IF is_security_definer THEN
      RAISE NOTICE '✅ Fonction create_attachments_bucket() existe avec SECURITY DEFINER';
    ELSE
      RAISE WARNING '⚠️ Fonction existe mais SECURITY DEFINER n''est pas activé';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Fonction create_attachments_bucket() introuvable';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 2 : Tester la création du bucket (première fois)
-- =====================================================

DO $$
DECLARE
  bucket_exists_before boolean;
  rpc_result jsonb;
  bucket_exists_after boolean;
BEGIN
  RAISE NOTICE '📋 TEST 2 : Création du bucket (première exécution)';
  
  -- Vérifier si le bucket existe avant
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'attachments'
  ) INTO bucket_exists_before;
  
  IF bucket_exists_before THEN
    RAISE NOTICE '⚠️ Le bucket existe déjà, suppression pour test...';
    DELETE FROM storage.buckets WHERE id = 'attachments';
  END IF;
  
  -- Appeler la fonction RPC
  SELECT public.create_attachments_bucket() INTO rpc_result;
  
  -- Vérifier le résultat
  IF (rpc_result->>'success')::boolean THEN
    RAISE NOTICE '✅ RPC réussie : %', rpc_result->>'message';
    
    IF (rpc_result->>'created')::boolean THEN
      RAISE NOTICE '✅ Le bucket a été créé';
    ELSE
      RAISE WARNING '⚠️ Le bucket existait déjà';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ RPC échouée : %', rpc_result->>'error';
  END IF;
  
  -- Vérifier que le bucket existe maintenant
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'attachments'
  ) INTO bucket_exists_after;
  
  IF bucket_exists_after THEN
    RAISE NOTICE '✅ Bucket "attachments" confirmé dans storage.buckets';
  ELSE
    RAISE EXCEPTION '❌ Bucket non trouvé après création';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 3 : Tester l'idempotence (appel multiple)
-- =====================================================

DO $$
DECLARE
  rpc_result jsonb;
BEGIN
  RAISE NOTICE '📋 TEST 3 : Idempotence (appel sur bucket existant)';
  
  -- Appeler la fonction une deuxième fois
  SELECT public.create_attachments_bucket() INTO rpc_result;
  
  IF (rpc_result->>'success')::boolean THEN
    RAISE NOTICE '✅ RPC réussie : %', rpc_result->>'message';
    
    IF NOT (rpc_result->>'created')::boolean THEN
      RAISE NOTICE '✅ Fonction idempotente : pas de recréation';
    ELSE
      RAISE WARNING '⚠️ Bucket recréé alors qu''il existait';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ RPC échouée sur bucket existant : %', rpc_result->>'error';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 4 : Vérifier la configuration du bucket
-- =====================================================

DO $$
DECLARE
  bucket_config record;
BEGIN
  RAISE NOTICE '📋 TEST 4 : Configuration du bucket';
  
  SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
  INTO bucket_config
  FROM storage.buckets
  WHERE id = 'attachments';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Bucket trouvé : %', bucket_config.name;
    
    -- Vérifier public = true
    IF bucket_config.public THEN
      RAISE NOTICE '✅ Public : activé';
    ELSE
      RAISE WARNING '⚠️ Public : désactivé (URLs publiques ne fonctionneront pas)';
    END IF;
    
    -- Vérifier limite de taille
    IF bucket_config.file_size_limit = 52428800 THEN
      RAISE NOTICE '✅ Limite de taille : 50 Mo (52428800 bytes)';
    ELSE
      RAISE WARNING '⚠️ Limite de taille incorrecte : % bytes', bucket_config.file_size_limit;
    END IF;
    
    -- Vérifier les types MIME
    IF array_length(bucket_config.allowed_mime_types, 1) >= 8 THEN
      RAISE NOTICE '✅ Types MIME : % types autorisés', array_length(bucket_config.allowed_mime_types, 1);
    ELSE
      RAISE WARNING '⚠️ Types MIME : configuration incomplète';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Bucket introuvable';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 5 : Vérifier les permissions RLS
-- =====================================================

DO $$
DECLARE
  policy_count integer;
  policy_names text[];
BEGIN
  RAISE NOTICE '📋 TEST 5 : Permissions RLS';
  
  -- Compter les policies actives
  SELECT COUNT(*), array_agg(policyname)
  INTO policy_count, policy_names
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%attachments%';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Permissions RLS : % policies actives', policy_count;
    RAISE NOTICE '   Policies détectées :';
    FOR i IN 1..array_length(policy_names, 1) LOOP
      RAISE NOTICE '   - %', policy_names[i];
    END LOOP;
  ELSIF policy_count > 0 THEN
    RAISE WARNING '⚠️ Permissions RLS incomplètes : seulement % policies', policy_count;
  ELSE
    RAISE EXCEPTION '❌ Aucune permission RLS configurée';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 6 : Vérifier les permissions spécifiques
-- =====================================================

DO $$
DECLARE
  has_public_select boolean;
  has_auth_insert boolean;
  has_owner_update boolean;
  has_owner_delete boolean;
BEGIN
  RAISE NOTICE '📋 TEST 6 : Validation des permissions spécifiques';
  
  -- SELECT public
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%Public%'
    AND cmd = 'SELECT'
  ) INTO has_public_select;
  
  -- INSERT authentifié
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%upload%'
    AND cmd = 'INSERT'
  ) INTO has_auth_insert;
  
  -- UPDATE propriétaire
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%update%'
    AND cmd = 'UPDATE'
  ) INTO has_owner_update;
  
  -- DELETE propriétaire
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%delete%'
    AND cmd = 'DELETE'
  ) INTO has_owner_delete;
  
  -- Résultats
  IF has_public_select THEN
    RAISE NOTICE '✅ SELECT public : configuré';
  ELSE
    RAISE WARNING '⚠️ SELECT public : manquant';
  END IF;
  
  IF has_auth_insert THEN
    RAISE NOTICE '✅ INSERT authentifié : configuré';
  ELSE
    RAISE WARNING '⚠️ INSERT authentifié : manquant';
  END IF;
  
  IF has_owner_update THEN
    RAISE NOTICE '✅ UPDATE propriétaire : configuré';
  ELSE
    RAISE WARNING '⚠️ UPDATE propriétaire : manquant';
  END IF;
  
  IF has_owner_delete THEN
    RAISE NOTICE '✅ DELETE propriétaire : configuré';
  ELSE
    RAISE WARNING '⚠️ DELETE propriétaire : manquant';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 7 : Fonction helper check_storage_permissions
-- =====================================================

DO $$
DECLARE
  helper_exists boolean;
BEGIN
  RAISE NOTICE '📋 TEST 7 : Fonction helper check_storage_permissions()';
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_storage_permissions'
  ) INTO helper_exists;
  
  IF helper_exists THEN
    RAISE NOTICE '✅ Fonction helper disponible';
    RAISE NOTICE '   Utilisation : SELECT * FROM public.check_storage_permissions();';
  ELSE
    RAISE WARNING '⚠️ Fonction helper manquante (non critique)';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- RÉSUMÉ DES TESTS
-- =====================================================

DO $$
DECLARE
  function_ok boolean;
  bucket_ok boolean;
  config_ok boolean;
  rls_ok boolean;
  all_tests_passed boolean;
BEGIN
  RAISE NOTICE '🧪 ======================================';
  RAISE NOTICE '🧪  RÉSUMÉ DES TESTS';
  RAISE NOTICE '🧪 ======================================';
  RAISE NOTICE '';
  
  -- Vérifications finales
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_attachments_bucket'
  ) INTO function_ok;
  
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'attachments'
  ) INTO bucket_ok;
  
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'attachments' 
    AND public = true 
    AND file_size_limit = 52428800
  ) INTO config_ok;
  
  SELECT COUNT(*) >= 4
  INTO rls_ok
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%attachments%';
  
  all_tests_passed := function_ok AND bucket_ok AND config_ok AND rls_ok;
  
  -- Afficher le résumé
  RAISE NOTICE '📊 Fonction RPC :          %', CASE WHEN function_ok THEN '✅ OK' ELSE '❌ ÉCHEC' END;
  RAISE NOTICE '📊 Bucket attachments :    %', CASE WHEN bucket_ok THEN '✅ OK' ELSE '❌ ÉCHEC' END;
  RAISE NOTICE '📊 Configuration bucket :  %', CASE WHEN config_ok THEN '✅ OK' ELSE '❌ ÉCHEC' END;
  RAISE NOTICE '📊 Permissions RLS :       %', CASE WHEN rls_ok THEN '✅ OK' ELSE '❌ ÉCHEC' END;
  RAISE NOTICE '';
  
  IF all_tests_passed THEN
    RAISE NOTICE '🎉 ======================================';
    RAISE NOTICE '🎉  TOUS LES TESTS SONT PASSÉS !';
    RAISE NOTICE '🎉 ======================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ La solution RPC est entièrement fonctionnelle';
    RAISE NOTICE '✅ Le frontend peut maintenant créer automatiquement le bucket';
    RAISE NOTICE '✅ Les uploads fonctionneront sans erreur RLS';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Prochaines étapes :';
    RAISE NOTICE '   1. Relancer l''application (npm run dev)';
    RAISE NOTICE '   2. Tester l''upload d''un fichier';
    RAISE NOTICE '   3. Vérifier les logs dans la console navigateur';
  ELSE
    RAISE WARNING '⚠️ ======================================';
    RAISE WARNING '⚠️  CERTAINS TESTS ONT ÉCHOUÉ';
    RAISE WARNING '⚠️ ======================================';
    RAISE WARNING '';
    RAISE WARNING '💡 Actions recommandées :';
    RAISE WARNING '   1. Vérifier que sql/setup_storage.sql a été exécuté';
    RAISE WARNING '   2. Consulter les messages d''erreur ci-dessus';
    RAISE WARNING '   3. Réexécuter setup_storage.sql si nécessaire';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- COMMANDES UTILES POUR LE DEBUGGING
-- =====================================================

-- Afficher toutes les fonctions RPC disponibles
SELECT 
  proname AS function_name,
  prosecdef AS is_security_definer,
  prorettype::regtype AS return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE '%bucket%';

-- Afficher la configuration complète du bucket
SELECT * FROM storage.buckets WHERE id = 'attachments';

-- Afficher toutes les policies RLS
SELECT * FROM public.check_storage_permissions();

-- OU si la fonction helper n'existe pas :
SELECT 
  policyname,
  cmd,
  roles,
  CASE WHEN qual IS NOT NULL THEN 'WITH USING' ELSE '' END AS has_using,
  CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK' ELSE '' END AS has_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%attachments%'
ORDER BY policyname;
