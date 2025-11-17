-- 🚨 CORRECTION URGENTE : Confirmer TOUS les emails
-- Exécutez ce script IMMÉDIATEMENT dans Supabase SQL Editor

-- 1. Confirmer TOUS les comptes existants
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  confirmation_sent_at = NULL
WHERE email_confirmed_at IS NULL;

-- 2. Vérification
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmé'
    ELSE '❌ Non confirmé'
  END as status
FROM auth.users
ORDER BY created_at DESC;
