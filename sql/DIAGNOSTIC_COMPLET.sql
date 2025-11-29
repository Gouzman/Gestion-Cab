-- =====================================================
-- DIAGNOSTIC COMPLET DU SYSTÈME
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor pour voir ce qui existe déjà
-- =====================================================

SELECT '🔍 DIAGNOSTIC - Tables existantes' as titre;

SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('profiles', 'internal_sessions', 'user_secret_phrases', 'password_history', 'login_attempts')
ORDER BY tablename;


SELECT '🔍 DIAGNOSTIC - Colonnes de la table profiles' as titre;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;


SELECT '🔍 DIAGNOSTIC - Fonctions RPC existantes' as titre;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%login%'
  OR routine_name LIKE '%session%'
  OR routine_name LIKE '%password%'
  OR routine_name LIKE '%auth%'
  OR routine_name LIKE '%secret%'
)
ORDER BY routine_name;


SELECT '🔍 DIAGNOSTIC - Utilisateurs dans profiles' as titre;

SELECT 
  id,
  email,
  name,
  role,
  COALESCE(must_change_password, false) as must_change_password,
  COALESCE(has_custom_password, false) as has_custom_password,
  COALESCE(admin_approved, false) as admin_approved,
  initial_password IS NOT NULL as has_initial_password
FROM public.profiles
LIMIT 5;


SELECT '🔍 DIAGNOSTIC - Utilisateurs dans auth.users' as titre;

SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
LIMIT 5;


SELECT '📊 RÉSUMÉ' as titre;

SELECT 
  'Tables' as type,
  COUNT(*) as count
FROM pg_tables
WHERE tablename IN ('profiles', 'internal_sessions', 'user_secret_phrases', 'password_history', 'login_attempts')
UNION ALL
SELECT 
  'Fonctions RPC' as type,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'internal_login',
  'verify_internal_session',
  'internal_logout',
  'internal_set_personal_credentials',
  'create_auth_user_with_profile',
  'generate_initial_password'
)
UNION ALL
SELECT 
  'Utilisateurs profiles' as type,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Utilisateurs auth.users' as type,
  COUNT(*) as count
FROM auth.users;
