-- =============================================
-- FORCER PREMIÈRE CONNEXION (must_change_password = true)
-- =============================================

-- 1. Voir le statut actuel (REMPLACEZ l'email)
SELECT 
  id,
  email,
  initial_password IS NOT NULL as a_initial_password,
  must_change_password,
  has_custom_password
FROM profiles
WHERE email = 'votre-email@example.com';

-- 2. Forcer must_change_password = true pour votre compte (REMPLACEZ l'email)
UPDATE profiles
SET must_change_password = true,
    has_custom_password = false
WHERE email = 'votre-email@example.com';

-- 3. Vérifier que c'est bien modifié (REMPLACEZ l'email)
SELECT 
  id,
  email,
  initial_password IS NOT NULL as a_initial_password,
  must_change_password,
  has_custom_password
FROM profiles
WHERE email = 'votre-email@example.com';
