-- =====================================================
-- SCRIPT DE TEST : Système de réinitialisation
-- =====================================================

-- 1️⃣ Vérifier que la table existe
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'password_reset_requests';

-- 2️⃣ Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'password_reset_requests'
ORDER BY ordinal_position;

-- 3️⃣ Vérifier que les fonctions RPC existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_secret_question',
    'verify_secret_answer',
    'create_reset_request',
    'approve_reset_request',
    'reject_reset_request'
  )
ORDER BY routine_name;

-- 4️⃣ Lister tous les utilisateurs disponibles pour test
SELECT 
  id,
  email,
  name,
  matricule,
  role,
  function
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ Créer une demande de test manuellement
-- ⚠️ REMPLACEZ 'test@example.com' par un email existant de votre table profiles
-- Décommentez les lignes suivantes après avoir remplacé l'email :

/*
DO $$
DECLARE
  test_user_id UUID;
  test_user_email TEXT;
  test_user_name TEXT;
  test_user_title TEXT;
BEGIN
  -- Récupérer les infos du premier utilisateur
  SELECT id, email, name, function 
  INTO test_user_id, test_user_email, test_user_name, test_user_title
  FROM public.profiles
  WHERE role != 'admin'  -- Éviter de créer une demande pour un admin
  LIMIT 1;

  -- Créer la demande de test
  INSERT INTO public.password_reset_requests (
    user_id,
    user_email,
    user_name,
    user_title,
    status,
    failed_attempts
  )
  VALUES (
    test_user_id,
    test_user_email,
    test_user_name,
    test_user_title,
    'pending',
    3
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Demande de test créée pour: % (%)', test_user_name, test_user_email;
END $$;
*/

-- 6️⃣ Vérifier les demandes créées
SELECT 
  id,
  user_email,
  user_name,
  user_title,
  status,
  failed_attempts,
  requested_at,
  reviewed_at,
  reviewed_by
FROM public.password_reset_requests
ORDER BY requested_at DESC;

-- 7️⃣ Compter les demandes par statut
SELECT 
  status,
  COUNT(*) as count
FROM public.password_reset_requests
GROUP BY status
ORDER BY status;

-- 8️⃣ Vérifier les politiques RLS actives
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'password_reset_requests'
ORDER BY policyname;

-- 9️⃣ Vérifier si RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'password_reset_requests';
