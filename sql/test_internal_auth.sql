-- =====================================================
-- SCRIPT DE TEST - SYSTÈME D'AUTHENTIFICATION INTERNE
-- =====================================================
-- Ce script permet de tester tous les scénarios d'auth
-- =====================================================

-- 🧹 NETTOYAGE : Supprimer les données de test existantes
-- =====================================================
DELETE FROM public.internal_sessions WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test-auth.com'
);

DELETE FROM public.user_secret_phrases WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test-auth.com'
);

DELETE FROM public.password_history WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@test-auth.com'
);

DELETE FROM public.login_attempts WHERE user_identifier LIKE '%@test-auth.com';

DELETE FROM public.profiles WHERE email LIKE '%@test-auth.com';
DELETE FROM auth.users WHERE email LIKE '%@test-auth.com';


-- ✅ TEST 1 : Créer un utilisateur de test
-- =====================================================
SELECT public.create_auth_user_with_profile(
  'testuser@test-auth.com',
  'GenericPassword123!',
  'Test User',
  'collaborator',
  'Avocat'
) as test_user_creation;

-- Vérifier la création
SELECT 
  id,
  email,
  name,
  role,
  must_change_password,
  has_custom_password,
  admin_approved
FROM public.profiles
WHERE email = 'testuser@test-auth.com';

-- Résultat attendu :
-- must_change_password = true
-- has_custom_password = false
-- admin_approved = false


-- ✅ TEST 2 : Approuver l'utilisateur (simuler action admin)
-- =====================================================
UPDATE public.profiles
SET admin_approved = true
WHERE email = 'testuser@test-auth.com';


-- ✅ TEST 3 : Tester la connexion avec mot de passe générique
-- =====================================================
SELECT public.internal_login(
  'testuser@test-auth.com',
  'GenericPassword123!',
  'Mozilla/5.0 (Test)',
  '127.0.0.1'
) as first_login_result;

-- Résultat attendu :
-- success = true
-- session_token = [string]
-- user.must_change_password = true
-- user.has_custom_password = false


-- ✅ TEST 4 : Vérifier la session créée
-- =====================================================
SELECT 
  s.id,
  s.user_id,
  s.session_token,
  s.expires_at,
  s.created_at,
  p.email
FROM public.internal_sessions s
JOIN public.profiles p ON p.id = s.user_id
WHERE p.email = 'testuser@test-auth.com'
ORDER BY s.created_at DESC
LIMIT 1;

-- Résultat attendu : 1 ligne avec expires_at = NOW() + 7 days


-- ✅ TEST 5 : Vérifier une session valide
-- =====================================================
-- Remplacer TOKEN_ICI par le session_token récupéré ci-dessus
SELECT public.verify_internal_session('TOKEN_ICI') as session_verification;

-- Résultat attendu :
-- success = true
-- user = {...}


-- ✅ TEST 6 : Définir le mot de passe personnel et phrase secrète
-- =====================================================
SELECT public.internal_set_personal_credentials(
  'testuser@test-auth.com',
  'MyNewSecurePassword123!@#',
  'Quel est le nom de votre premier animal de compagnie ?',
  'Médor'
) as set_credentials_result;

-- Résultat attendu :
-- success = true


-- ✅ TEST 7 : Vérifier la mise à jour du profil
-- =====================================================
SELECT 
  id,
  email,
  must_change_password,
  has_custom_password,
  last_password_change,
  password_change_count
FROM public.profiles
WHERE email = 'testuser@test-auth.com';

-- Résultat attendu :
-- must_change_password = false
-- has_custom_password = true
-- last_password_change = NOW()
-- password_change_count = 1


-- ✅ TEST 8 : Vérifier la phrase secrète enregistrée
-- =====================================================
SELECT 
  user_id,
  question_encrypted,
  answer_hash,
  created_at,
  updated_at
FROM public.user_secret_phrases
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com');

-- Résultat attendu : 1 ligne avec question_encrypted (base64)


-- ✅ TEST 9 : Vérifier l'historique des mots de passe
-- =====================================================
SELECT 
  user_id,
  password_hash,
  created_at
FROM public.password_history
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com')
ORDER BY created_at DESC;

-- Résultat attendu : 1 ligne (le nouveau mot de passe)


-- ✅ TEST 10 : Tester la connexion avec le NOUVEAU mot de passe
-- =====================================================
SELECT public.internal_login(
  'testuser@test-auth.com',
  'MyNewSecurePassword123!@#',
  'Mozilla/5.0 (Test)',
  '127.0.0.1'
) as login_with_new_password;

-- Résultat attendu :
-- success = true
-- session_token = [nouveau token]
-- user.must_change_password = false
-- user.has_custom_password = true


-- ✅ TEST 11 : Vérifier qu'on ne peut plus se connecter avec l'ancien mot de passe
-- =====================================================
SELECT public.internal_login(
  'testuser@test-auth.com',
  'GenericPassword123!',
  'Mozilla/5.0 (Test)',
  '127.0.0.1'
) as login_with_old_password;

-- Résultat attendu :
-- success = false
-- error = 'invalid_credentials'


-- ✅ TEST 12 : Récupérer la question secrète
-- =====================================================
SELECT public.get_secret_question('testuser@test-auth.com') as get_question;

-- Résultat attendu :
-- success = true
-- question = 'Quel est le nom de votre premier animal de compagnie ?'


-- ✅ TEST 13 : Tester avec une MAUVAISE réponse
-- =====================================================
SELECT public.verify_secret_answer_and_reset(
  'testuser@test-auth.com',
  'MauvaiseRéponse',
  'NewPassword456!'
) as wrong_answer_test;

-- Résultat attendu :
-- success = false
-- error = 'wrong_answer'


-- ✅ TEST 14 : Tester avec la BONNE réponse
-- =====================================================
SELECT public.verify_secret_answer_and_reset(
  'testuser@test-auth.com',
  'Médor',
  'ResetPassword789!@#'
) as correct_answer_test;

-- Résultat attendu :
-- success = true


-- ✅ TEST 15 : Vérifier que le mot de passe a été changé
-- =====================================================
SELECT public.internal_login(
  'testuser@test-auth.com',
  'ResetPassword789!@#',
  'Mozilla/5.0 (Test)',
  '127.0.0.1'
) as login_after_reset;

-- Résultat attendu :
-- success = true


-- ✅ TEST 16 : Vérifier l'historique (doit avoir 2 entrées maintenant)
-- =====================================================
SELECT 
  COUNT(*) as password_count
FROM public.password_history
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com');

-- Résultat attendu : 2


-- ✅ TEST 17 : Tester la réutilisation d'un ancien mot de passe
-- =====================================================
SELECT public.internal_set_personal_credentials(
  'testuser@test-auth.com',
  'MyNewSecurePassword123!@#',  -- Mot de passe déjà utilisé
  'Question test',
  'Réponse test'
) as password_reuse_test;

-- Résultat attendu :
-- success = false
-- error = 'password_reused'


-- ✅ TEST 18 : Tester la déconnexion
-- =====================================================
-- Remplacer TOKEN_ICI par un session_token valide
SELECT public.internal_logout('TOKEN_ICI') as logout_test;

-- Résultat attendu :
-- success = true


-- ✅ TEST 19 : Vérifier que la session a été supprimée
-- =====================================================
SELECT public.verify_internal_session('TOKEN_ICI') as verify_after_logout;

-- Résultat attendu :
-- success = false
-- error = 'invalid_session'


-- ✅ TEST 20 : Tester le nettoyage des sessions expirées
-- =====================================================
-- Créer une session expirée
INSERT INTO public.internal_sessions (
  user_id,
  session_token,
  expires_at
)
VALUES (
  (SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com'),
  'expired_token_test',
  NOW() - INTERVAL '1 day'
);

-- Nettoyer
SELECT public.cleanup_expired_sessions() as cleanup_result;

-- Vérifier
SELECT COUNT(*) as expired_sessions_remaining
FROM public.internal_sessions
WHERE expires_at < NOW();

-- Résultat attendu : 0


-- ✅ TEST 21 : Vérifier les tentatives de connexion journalisées
-- =====================================================
SELECT 
  user_identifier,
  attempt_success,
  attempt_error,
  attempted_at
FROM public.login_attempts
WHERE user_identifier = 'testuser@test-auth.com'
ORDER BY attempted_at DESC
LIMIT 10;

-- Résultat attendu : Plusieurs lignes (succès et échecs)


-- ✅ TEST 22 : Compter les sessions actives
-- =====================================================
SELECT 
  COUNT(*) as active_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.internal_sessions
WHERE expires_at > NOW();


-- 📊 RÉSUMÉ DES TESTS
-- =====================================================
SELECT 
  '✅ Tous les tests terminés' as message,
  'Vérifiez que tous les résultats correspondent aux résultats attendus' as note;


-- 🧹 NETTOYAGE FINAL (optionnel)
-- =====================================================
-- Décommenter pour supprimer l'utilisateur de test
/*
DELETE FROM public.internal_sessions WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com'
);

DELETE FROM public.user_secret_phrases WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com'
);

DELETE FROM public.password_history WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'testuser@test-auth.com'
);

DELETE FROM public.login_attempts WHERE user_identifier = 'testuser@test-auth.com';

DELETE FROM public.profiles WHERE email = 'testuser@test-auth.com';
DELETE FROM auth.users WHERE email = 'testuser@test-auth.com';

SELECT '🧹 Utilisateur de test supprimé' as cleanup;
*/
