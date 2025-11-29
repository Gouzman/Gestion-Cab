-- ============================================
-- DIAGNOSTIC COMPLET UTILISATEUR
-- ============================================

-- 1. Voir tous les utilisateurs dans profiles
SELECT 
  id,
  email,
  role,
  approval_status,
  initial_password,
  must_change_password,
  has_custom_password,
  last_password_change
FROM profiles
ORDER BY created_at DESC;

-- 2. Voir tous les utilisateurs dans auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Test de connexion avec l'email
-- REMPLACEZ 'votre-email@example.com' et 'votre-mot-de-passe' par vos vrais identifiants
SELECT internal_login(
  'votre-email@example.com',
  'votre-mot-de-passe',
  'Test manual',
  '127.0.0.1'
);

-- 4. Vérifier si le mot de passe est bien hashé
-- REMPLACEZ 'votre-email@example.com' par votre vrai email
SELECT 
  email,
  initial_password IS NOT NULL as a_mot_de_passe_initial,
  LENGTH(initial_password) as longueur_hash,
  must_change_password,
  has_custom_password
FROM profiles
WHERE email = 'votre-email@example.com';

-- 5. Test de hash bcrypt
-- REMPLACEZ 'votre-mot-de-passe' par votre vrai mot de passe
-- REMPLACEZ 'votre-email@example.com' par votre vrai email
SELECT 
  email,
  crypt('votre-mot-de-passe', initial_password) = initial_password as password_match_initial,
  initial_password as hash_stocke
FROM profiles
WHERE email = 'votre-email@example.com';
