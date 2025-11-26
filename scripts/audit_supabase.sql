-- ================================================================
-- SCRIPT D'AUDIT SUPABASE - LECTURE SEULE
-- Date: 2025-11-26
-- Objectif: Vérifier l'existence et la configuration des éléments
--           sans rien créer, modifier ou supprimer
-- ================================================================

-- ==============================================================
-- 1️⃣ BUCKETS STORAGE
-- ==============================================================
SELECT 
    '=== BUCKETS STORAGE ===' as section,
    '' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'attachments') 
        THEN '✔️ attachments - OK'
        ELSE '❌ attachments - MANQUANT'
    END as bucket_attachments;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'task-scans') 
        THEN '✔️ task-scans - OK'
        ELSE '❌ task-scans - MANQUANT'
    END as bucket_task_scans;

-- Détails des buckets existants
SELECT 
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name IN ('attachments', 'task-scans')
ORDER BY name;

-- ==============================================================
-- 2️⃣ POLICIES RLS SUR LES BUCKETS
-- ==============================================================
SELECT 
    '' as separator,
    '=== POLICIES RLS BUCKETS ===' as section,
    '' as info;

-- Policies pour bucket 'attachments'
SELECT 
    'BUCKET: attachments' as bucket,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN roles @> ARRAY['authenticated'::name] THEN 'authenticated'
        WHEN roles @> ARRAY['anon'::name] THEN 'public'
        ELSE roles::text
    END as roles
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%attachments%'
ORDER BY cmd;

-- Policies pour bucket 'task-scans'
SELECT 
    'BUCKET: task-scans' as bucket,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN roles @> ARRAY['authenticated'::name] THEN 'authenticated'
        WHEN roles @> ARRAY['anon'::name] THEN 'public'
        ELSE roles::text
    END as roles
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%task-scans%'
ORDER BY cmd;

-- Vérification générale des policies attendues
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
                AND tablename = 'objects'
                AND cmd = 'SELECT'
                AND policyname LIKE '%attachments%'
        ) 
        THEN '✔️ SELECT policy on attachments - OK'
        ELSE '❌ SELECT policy on attachments - MANQUANT'
    END as policy_select_attachments;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
                AND tablename = 'objects'
                AND cmd = 'INSERT'
                AND policyname LIKE '%attachments%'
        ) 
        THEN '✔️ INSERT policy on attachments - OK'
        ELSE '❌ INSERT policy on attachments - MANQUANT'
    END as policy_insert_attachments;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
                AND tablename = 'objects'
                AND cmd = 'UPDATE'
                AND policyname LIKE '%attachments%'
        ) 
        THEN '✔️ UPDATE policy on attachments - OK'
        ELSE '❌ UPDATE policy on attachments - MANQUANT'
    END as policy_update_attachments;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
                AND tablename = 'objects'
                AND cmd = 'DELETE'
                AND policyname LIKE '%attachments%'
        ) 
        THEN '✔️ DELETE policy on attachments - OK'
        ELSE '❌ DELETE policy on attachments - MANQUANT'
    END as policy_delete_attachments;

-- ==============================================================
-- 3️⃣ FONCTIONS RPC DISPONIBLES
-- ==============================================================
SELECT 
    '' as separator,
    '=== FONCTIONS RPC ===' as section,
    '' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
                AND p.proname = 'create_attachments_bucket'
        ) 
        THEN '✔️ create_attachments_bucket - OK'
        ELSE '❌ create_attachments_bucket - MANQUANT'
    END as rpc_create_attachments;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
                AND p.proname = 'create_task_scans_bucket'
        ) 
        THEN '✔️ create_task_scans_bucket - OK'
        ELSE '❌ create_task_scans_bucket - MANQUANT'
    END as rpc_create_task_scans;

-- Liste toutes les fonctions RPC disponibles dans le schéma public
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname LIKE '%bucket%'
ORDER BY p.proname;

-- ==============================================================
-- 4️⃣ TABLES OBLIGATOIRES
-- ==============================================================
SELECT 
    '' as separator,
    '=== TABLES OBLIGATOIRES ===' as section,
    '' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'app_settings'
        ) 
        THEN '✔️ app_settings - OK'
        ELSE '❌ app_settings - MANQUANT'
    END as table_app_settings;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'calendar_events'
        ) 
        THEN '✔️ calendar_events - OK'
        ELSE '❌ calendar_events - MANQUANT'
    END as table_calendar_events;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'tasks_files'
        ) 
        THEN '✔️ tasks_files - OK'
        ELSE '❌ tasks_files - MANQUANT'
    END as table_tasks_files;

-- ==============================================================
-- 5️⃣ COLONNES DE LA TABLE CASES
-- ==============================================================
SELECT 
    '' as separator,
    '=== COLONNES TABLE CASES ===' as section,
    '' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'notes'
        ) 
        THEN '✔️ cases.notes - OK'
        ELSE '❌ cases.notes - MANQUANT'
    END as column_notes;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'honoraire'
        ) 
        THEN '✔️ cases.honoraire - OK'
        ELSE '❌ cases.honoraire - MANQUANT'
    END as column_honoraire;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'expected_end_date'
        ) 
        THEN '✔️ cases.expected_end_date - OK'
        ELSE '❌ cases.expected_end_date - MANQUANT'
    END as column_expected_end_date;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'attachments'
        ) 
        THEN '✔️ cases.attachments - OK'
        ELSE '❌ cases.attachments - MANQUANT'
    END as column_attachments;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'client_id'
        ) 
        THEN '✔️ cases.client_id - OK'
        ELSE '❌ cases.client_id - MANQUANT'
    END as column_client_id;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'created_by'
        ) 
        THEN '✔️ cases.created_by - OK'
        ELSE '❌ cases.created_by - MANQUANT'
    END as column_created_by;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'opposing_party'
        ) 
        THEN '✔️ cases.opposing_party - OK'
        ELSE '❌ cases.opposing_party - MANQUANT'
    END as column_opposing_party;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'start_date'
        ) 
        THEN '✔️ cases.start_date - OK'
        ELSE '❌ cases.start_date - MANQUANT'
    END as column_start_date;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'time_spent'
        ) 
        THEN '✔️ cases.time_spent - OK'
        ELSE '❌ cases.time_spent - MANQUANT'
    END as column_time_spent;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'cases'
                AND column_name = 'visible_to'
        ) 
        THEN '✔️ cases.visible_to - OK'
        ELSE '❌ cases.visible_to - MANQUANT'
    END as column_visible_to;

-- Détails des colonnes existantes dans cases
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'cases'
    AND column_name IN (
        'notes', 'honoraire', 'expected_end_date', 'attachments',
        'client_id', 'created_by', 'opposing_party', 'start_date',
        'time_spent', 'visible_to'
    )
ORDER BY column_name;

-- ==============================================================
-- 6️⃣ TABLES DES MODULES (OPTIONNEL)
-- ==============================================================
SELECT 
    '' as separator,
    '=== TABLES DES MODULES ===' as section,
    '' as info;

-- Module Tâches
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'tasks'
        ) 
        THEN '✔️ tasks (Module Tâches) - OK'
        ELSE '❌ tasks (Module Tâches) - MANQUANT'
    END as module_tasks;

-- Module Documents
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'documents'
        ) 
        THEN '✔️ documents (Module Documents) - OK'
        ELSE '❌ documents (Module Documents) - MANQUANT'
    END as module_documents;

-- Module Collaborateurs
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'profiles'
        ) 
        THEN '✔️ profiles (Module Collaborateurs) - OK'
        ELSE '❌ profiles (Module Collaborateurs) - MANQUANT'
    END as module_profiles;

-- Module Facturation
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'invoices'
        ) 
        THEN '✔️ invoices (Module Facturation) - OK'
        ELSE '❌ invoices (Module Facturation) - MANQUANT'
    END as module_invoices;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'invoice_items'
        ) 
        THEN '✔️ invoice_items (Module Facturation) - OK'
        ELSE '❌ invoice_items (Module Facturation) - MANQUANT'
    END as module_invoice_items;

-- Module Agenda
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'calendar_events'
        ) 
        THEN '✔️ calendar_events (Module Agenda) - OK'
        ELSE '❌ calendar_events (Module Agenda) - MANQUANT'
    END as module_calendar;

-- ==============================================================
-- RÉSUMÉ GÉNÉRAL
-- ==============================================================
SELECT 
    '' as separator,
    '=== RÉSUMÉ GÉNÉRAL ===' as section,
    '' as info;

-- Compte total des éléments
SELECT 
    'Buckets Storage' as categorie,
    COUNT(*) as nombre_existants
FROM storage.buckets
WHERE name IN ('attachments', 'task-scans');

SELECT 
    'Tables obligatoires' as categorie,
    (
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_settings') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks_files')
    ) as nombre_existants;

SELECT 
    'Colonnes cases' as categorie,
    COUNT(*) as nombre_existants
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'cases'
    AND column_name IN (
        'notes', 'honoraire', 'expected_end_date', 'attachments',
        'client_id', 'created_by', 'opposing_party', 'start_date',
        'time_spent', 'visible_to'
    );

SELECT 
    'Fonctions RPC buckets' as categorie,
    COUNT(*) as nombre_existants
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_attachments_bucket', 'create_task_scans_bucket');

-- ==============================================================
-- FIN DE L'AUDIT
-- ==============================================================
SELECT 
    '' as separator,
    '=== FIN DE L''AUDIT ===' as section,
    NOW() as date_audit;
