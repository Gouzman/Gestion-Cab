-- ============================================
-- DIAGNOSTIC SIMPLE - Voir les colonnes qui existent vraiment
-- ============================================

-- 1. Voir TOUTES les colonnes de la table profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Voir tous les utilisateurs (avec uniquement les colonnes de base)
SELECT 
  id,
  email,
  initial_password IS NOT NULL as a_initial_password,
  must_change_password,
  has_custom_password
FROM profiles
LIMIT 10;

-- 3. Voir un utilisateur spécifique (REMPLACEZ l'email)
SELECT *
FROM profiles
WHERE email = 'votre-email@example.com';

-- 4. Test direct de connexion (REMPLACEZ email et password)
SELECT internal_login(
  'votre-email@example.com',
  'votre-mot-de-passe',
  'Test',
  '127.0.0.1'
);
