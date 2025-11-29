-- =====================================================
-- TEST SIMPLE DE CONNEXION
-- =====================================================
-- Ce script teste si la connexion fonctionne avec un utilisateur existant
-- =====================================================

-- 1. Vérifier qu'il y a des utilisateurs
SELECT 
  '👥 Utilisateurs dans profiles' as titre,
  id,
  email,
  name,
  role,
  COALESCE(admin_approved, true) as admin_approved,
  COALESCE(must_change_password, false) as must_change_password,
  COALESCE(has_custom_password, false) as has_custom_password
FROM public.profiles
LIMIT 5;


-- 2. Vérifier les utilisateurs dans auth.users
SELECT 
  '🔐 Utilisateurs dans auth.users' as titre,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
LIMIT 5;


-- 3. Tester la fonction internal_login avec un utilisateur existant
-- REMPLACEZ 'votre-email@example.com' et 'votre-mot-de-passe' par vos vrais identifiants
SELECT 
  '🧪 Test de connexion' as titre,
  public.internal_login(
    'votre-email@example.com',  -- ⚠️ REMPLACER par votre vrai email
    'votre-mot-de-passe',         -- ⚠️ REMPLACER par votre vrai mot de passe
    'Test Browser',
    '127.0.0.1'
  ) as resultat;


-- 4. Vérifier si la fonction existe
SELECT 
  '✅ Fonctions RPC disponibles' as titre,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'internal_login',
  'verify_internal_session',
  'internal_logout',
  'internal_set_personal_credentials'
)
ORDER BY routine_name;


-- 5. Vérifier si la table internal_sessions existe
SELECT 
  '📊 Table internal_sessions' as titre,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'internal_sessions')
    THEN '✅ Table existe'
    ELSE '❌ Table MANQUANTE'
  END as status;
