-- =====================================================
-- DIAGNOSTIC PREMIÈRE CONNEXION
-- =====================================================
-- Vérifie que toutes les tables et colonnes nécessaires existent
-- Date: 5 décembre 2025

-- 1. Vérifier la table profiles et ses colonnes
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'must_change_password', 'has_custom_password',
    'auth_password', 'initial_password', 'last_password_change',
    'password_change_count'
  )
ORDER BY column_name;

-- 2. Vérifier la table password_history
SELECT 
  'password_history exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'password_history'
  ) as result;

-- 3. Vérifier la table user_secret_phrases
SELECT 
  'user_secret_phrases exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_secret_phrases'
  ) as result;

-- 4. Vérifier la fonction internal_set_personal_credentials
SELECT 
  'internal_set_personal_credentials exists' as check_name,
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'internal_set_personal_credentials'
  ) as result;

-- 5. Vérifier qu'il existe des utilisateurs en attente de première connexion
SELECT 
  'users_waiting_first_login' as check_name,
  COUNT(*) as count
FROM public.profiles
WHERE must_change_password = true;

-- 6. Exemple d'utilisateur en attente (sans afficher les mots de passe)
SELECT 
  id,
  email,
  name,
  role,
  must_change_password,
  has_custom_password,
  created_at
FROM public.profiles
WHERE must_change_password = true
LIMIT 3;

-- 7. Vérifier l'extension pgcrypto (nécessaire pour crypt)
SELECT 
  'pgcrypto extension' as check_name,
  EXISTS (
    SELECT FROM pg_extension
    WHERE extname = 'pgcrypto'
  ) as installed;
sql/FIX_PASSWORD_HASH_AMBIGUOUS.sql