-- ================================================================
-- VÉRIFICATION MANUELLE DES POLICIES RLS STORAGE
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ================================================================

-- Vue d'ensemble des policies sur storage.objects
SELECT 
    '=== POLICIES RLS SUR STORAGE.OBJECTS ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles::text as applicable_roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
ORDER BY policyname;

-- Vérification spécifique pour attachments
SELECT 
    '=== POLICIES POUR BUCKET ATTACHMENTS ===' as section;

SELECT 
    policyname,
    cmd as operation,
    roles::text as roles
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%attachments%'
ORDER BY cmd;

-- Vérification spécifique pour task-scans
SELECT 
    '=== POLICIES POUR BUCKET TASK-SCANS ===' as section;

SELECT 
    policyname,
    cmd as operation,
    roles::text as roles
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%task%scan%'
ORDER BY cmd;

-- Résumé des opérations couvertes
SELECT 
    '=== RÉSUMÉ DES OPÉRATIONS COUVERTES ===' as section;

WITH policy_ops AS (
    SELECT 
        CASE 
            WHEN policyname LIKE '%attachments%' THEN 'attachments'
            WHEN policyname LIKE '%task%scan%' THEN 'task-scans'
            ELSE 'other'
        END as bucket,
        cmd as operation
    FROM pg_policies 
    WHERE schemaname = 'storage' 
        AND tablename = 'objects'
)
SELECT 
    bucket,
    STRING_AGG(DISTINCT operation, ', ' ORDER BY operation) as operations_available
FROM policy_ops
WHERE bucket IN ('attachments', 'task-scans')
GROUP BY bucket;

-- Vérifier si RLS est activé sur storage.objects
SELECT 
    '=== STATUT RLS SUR STORAGE.OBJECTS ===' as section;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✔️ RLS ACTIVÉ'
        ELSE '❌ RLS DÉSACTIVÉ'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'storage'
    AND tablename = 'objects';
