-- ============================================
-- MIGRATION : AUTO-ACTIVATION DES COMPTES
-- ============================================
-- Objectif : Supprimer l'exigence d'approbation administrateur
-- Les comptes sont maintenant automatiquement actifs à la création
-- L'écran FirstLoginScreen reste affiché pour le premier changement de mot de passe
--
-- Date : $(date)
-- ============================================

BEGIN;

-- 1. Activer tous les comptes existants qui sont en attente d'approbation
UPDATE public.profiles
SET admin_approved = TRUE
WHERE admin_approved = FALSE;

-- 2. Vérifier le résultat
SELECT 
  COUNT(*) as total_comptes,
  COUNT(*) FILTER (WHERE admin_approved = TRUE) as comptes_actifs,
  COUNT(*) FILTER (WHERE admin_approved = FALSE) as comptes_en_attente,
  COUNT(*) FILTER (WHERE must_change_password = TRUE) as comptes_premier_login
FROM public.profiles;

-- 3. Afficher les comptes activés
SELECT 
  email,
  name,
  role,
  must_change_password,
  admin_approved,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

COMMIT;

-- ============================================
-- NOTES DE MIGRATION
-- ============================================
-- ✅ La vérification admin_approved a été supprimée de internal_login
-- ✅ Tous les comptes existants sont maintenant actifs
-- ✅ Les nouveaux comptes seront automatiquement actifs (admin_approved = TRUE par défaut)
-- ✅ FirstLoginScreen continue de s'afficher si must_change_password = TRUE
-- ✅ L'utilisateur voit le mot de passe générique et doit le changer
--
-- COMPORTEMENT APRÈS MIGRATION :
-- 1. L'admin crée un utilisateur avec un mot de passe générique
-- 2. L'utilisateur se connecte avec ce mot de passe (pas d'attente d'approbation)
-- 3. FirstLoginScreen s'affiche automatiquement
-- 4. L'utilisateur définit son mot de passe personnel + phrase secrète
-- 5. L'utilisateur accède au dashboard
-- ============================================
