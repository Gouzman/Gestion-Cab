-- 🚨 FORCER LA CONFIRMATION DES EMAILS (SOLUTION SIMPLE)
-- Si les triggers ne fonctionnent pas, cette solution force manuellement

-- 1. Confirmer TOUS les utilisateurs existants
UPDATE auth.users
SET 
  email_confirmed_at = CASE 
    WHEN email_confirmed_at IS NULL THEN now()
    ELSE email_confirmed_at
  END,
  confirmation_token = '',
  confirmation_sent_at = NULL;

-- 2. Vérifier les résultats
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ OK'
    ELSE '❌ PROBLÈME'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 3. Si vous voyez encore des emails non confirmés, désactivez la vérification :
-- Allez dans : Supabase Dashboard > Authentication > Settings
-- Désactivez "Enable email confirmations"
