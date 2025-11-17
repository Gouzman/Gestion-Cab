-- Script SQL pour vérifier et ajouter la colonne isFirstLogin
-- À exécuter dans Supabase SQL Editor

-- ==========================================
-- ÉTAPE 1 : Vérifier si la colonne existe
-- ==========================================

-- Cette requête retourne le nom de la colonne si elle existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'profiles' 
  AND column_name = 'isFirstLogin';

-- Si la requête retourne 0 ligne, la colonne n'existe pas
-- Passez à l'étape 2


-- ==========================================
-- ÉTAPE 2 : Ajouter la colonne si nécessaire
-- ==========================================

-- Ajouter la colonne isFirstLogin avec valeur par défaut true
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS "isFirstLogin" BOOLEAN DEFAULT true;

-- Vérification : cette requête doit maintenant retourner 1 ligne
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'isFirstLogin';


-- ==========================================
-- ÉTAPE 3 : Mettre à jour les utilisateurs existants
-- ==========================================

-- Mettre isFirstLogin à false pour tous les utilisateurs existants
-- (ceux créés avant cette fonctionnalité)
-- Cela évite qu'ils soient redirigés vers la création de mot de passe

UPDATE profiles 
SET "isFirstLogin" = false 
WHERE "isFirstLogin" IS NULL;

-- Vérifier combien d'utilisateurs ont été mis à jour
SELECT COUNT(*) as "Utilisateurs mis à jour"
FROM profiles 
WHERE "isFirstLogin" = false;


-- ==========================================
-- ÉTAPE 4 : Vérifier la configuration
-- ==========================================

-- Voir tous les utilisateurs avec leur statut isFirstLogin
SELECT 
  id,
  email,
  name,
  role,
  "isFirstLogin",
  created_at
FROM profiles
ORDER BY created_at DESC;


-- ==========================================
-- BONUS : Réinitialiser un utilisateur pour test
-- ==========================================

-- Si vous voulez tester le flux de première connexion
-- avec un utilisateur existant, mettez son isFirstLogin à true

-- ATTENTION : Cela force l'utilisateur à recréer son mot de passe !
-- Décommenter la ligne suivante et remplacer l'email

-- UPDATE profiles 
-- SET "isFirstLogin" = true 
-- WHERE email = 'utilisateur.test@example.com';


-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================

-- Cette requête doit afficher la structure complète de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ✅ Vérifiez que la colonne "isFirstLogin" apparaît avec :
--    - data_type = boolean
--    - is_nullable = YES
--    - column_default = true
