-- ============================================
-- TEST COMPLET : Assignation et Affichage des Tâches
-- ============================================
-- Date : 29 novembre 2025
-- Objectif : Valider que les tâches assignées apparaissent bien
--            dans le dashboard du collaborateur

-- ============================================
-- ÉTAPE 1 : Préparation des données de test
-- ============================================

-- 1.1 Lister les collaborateurs disponibles
SELECT 
  id,
  email,
  name,
  role,
  function
FROM profiles
WHERE role IS NOT NULL
ORDER BY created_at
LIMIT 10;

-- Note : Notez un user_id pour les tests ci-dessous
-- Remplacez 'COLLABORATEUR_UUID' par un vrai UUID

-- ============================================
-- ÉTAPE 2 : Créer une tâche de test
-- ============================================

-- 2.1 Créer une tâche assignée à un collaborateur spécifique
-- REMPLACEZ 'COLLABORATEUR_UUID' et 'ADMIN_UUID' par de vrais UUIDs

/*
INSERT INTO tasks (
  title,
  description,
  priority,
  status,
  deadline,
  assigned_to_id,
  assigned_to_ids,
  created_by_id,
  created_by_name,
  assigned_at
) VALUES (
  'TEST - Tâche assignée au collaborateur',
  'Cette tâche doit apparaître dans le dashboard du collaborateur assigné',
  'normal',
  'pending',
  NOW() + INTERVAL '7 days',
  'COLLABORATEUR_UUID',
  ARRAY['COLLABORATEUR_UUID'::UUID],
  'ADMIN_UUID',
  'Admin Test',
  NOW()
);
*/

-- ============================================
-- ÉTAPE 3 : Vérifier l'assignation
-- ============================================

-- 3.1 Vérifier que la tâche est bien créée avec assigned_to_ids rempli
SELECT 
  id,
  title,
  assigned_to_id,
  assigned_to_ids,
  created_by_id,
  created_at,
  CASE 
    WHEN assigned_to_id = ANY(assigned_to_ids) THEN '✅ Synchronisé'
    ELSE '❌ Non synchronisé'
  END as statut_sync
FROM tasks
WHERE title LIKE 'TEST - Tâche assignée%'
ORDER BY created_at DESC;

-- ============================================
-- ÉTAPE 4 : Simuler la requête du Dashboard collaborateur
-- ============================================

-- 4.1 Requête Dashboard (non-admin)
-- REMPLACEZ 'COLLABORATEUR_UUID' par le vrai UUID

/*
SELECT *
FROM tasks
WHERE assigned_to_id = 'COLLABORATEUR_UUID'
   OR 'COLLABORATEUR_UUID' = ANY(assigned_to_ids)
   OR 'COLLABORATEUR_UUID' = ANY(visible_by_ids)
ORDER BY created_at DESC;
*/

-- 4.2 Compter les tâches visibles par le collaborateur
-- REMPLACEZ 'COLLABORATEUR_UUID'

/*
SELECT 
  COUNT(*) as total_taches,
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  COUNT(*) FILTER (WHERE status = 'in_progress') as en_cours,
  COUNT(*) FILTER (WHERE status = 'completed') as completees,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgentes
FROM tasks
WHERE assigned_to_id = 'COLLABORATEUR_UUID'
   OR 'COLLABORATEUR_UUID' = ANY(assigned_to_ids)
   OR 'COLLABORATEUR_UUID' = ANY(visible_by_ids);
*/

-- ============================================
-- ÉTAPE 5 : Vérifier les RLS Policies
-- ============================================

-- 5.1 Lister les policies actuelles sur tasks
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 5.2 Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'tasks';

-- ============================================
-- ÉTAPE 6 : Test de visibilité (avec SET ROLE)
-- ============================================

-- Note : Cette partie nécessite des permissions spéciales
-- Elle simule la connexion en tant que collaborateur

-- 6.1 Se connecter en tant que collaborateur (simulation)
/*
-- Créer un rôle temporaire si nécessaire
CREATE ROLE test_collaborateur;
GRANT authenticated TO test_collaborateur;

-- Se connecter avec ce rôle
SET ROLE test_collaborateur;
SET request.jwt.claim.sub TO 'COLLABORATEUR_UUID';

-- Tester la requête
SELECT id, title, assigned_to_id, assigned_to_ids
FROM tasks
WHERE assigned_to_id = 'COLLABORATEUR_UUID'
   OR 'COLLABORATEUR_UUID' = ANY(assigned_to_ids);

-- Revenir au rôle normal
RESET ROLE;
*/

-- ============================================
-- ÉTAPE 7 : Nettoyage (optionnel)
-- ============================================

-- 7.1 Supprimer la tâche de test
/*
DELETE FROM tasks
WHERE title LIKE 'TEST - Tâche assignée%';
*/

-- ============================================
-- RÉSUMÉ DES VÉRIFICATIONS
-- ============================================

-- ✅ Vérifier que assigned_to_ids est automatiquement rempli
-- ✅ Vérifier que la requête OR retourne bien les tâches
-- ✅ Vérifier que les RLS policies autorisent la lecture
-- ✅ Vérifier que le front affiche correctement les tâches

-- ============================================
-- DIAGNOSTIC : Si les tâches n'apparaissent pas
-- ============================================

-- Problème 1 : assigned_to_ids vide
SELECT COUNT(*) as taches_sans_assigned_to_ids
FROM tasks
WHERE assigned_to_id IS NOT NULL
  AND (assigned_to_ids IS NULL OR assigned_to_ids = '{}');
-- Solution : Exécuter SYNC_ASSIGNED_TO_IDS.sql

-- Problème 2 : RLS bloque l'accès
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'tasks';
-- Solution : ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Problème 3 : Policy trop restrictive
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'tasks' AND cmd = 'SELECT';
-- Solution : Vérifier que la policy inclut OR avec assigned_to_ids

-- Problème 4 : currentUser.id undefined côté front
-- Solution : Vérifier dans la console browser que user.id existe
