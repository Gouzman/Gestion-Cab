-- ============================================
-- SYNCHRONISATION assigned_to_id → assigned_to_ids
-- ============================================
-- Date : 29 novembre 2025
-- Objectif : Assurer que toutes les tâches avec assigned_to_id
--            ont aussi leur UUID dans assigned_to_ids

-- 1️⃣ Voir les tâches non synchronisées
SELECT 
  id,
  title,
  assigned_to_id,
  assigned_to_ids,
  CASE 
    WHEN assigned_to_id IS NOT NULL AND (assigned_to_ids IS NULL OR NOT (assigned_to_id = ANY(assigned_to_ids))) 
    THEN '❌ Non synchronisé'
    ELSE '✅ OK'
  END as statut
FROM tasks
WHERE assigned_to_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;

-- 2️⃣ Synchroniser toutes les tâches
-- Si assigned_to_id existe mais n'est pas dans assigned_to_ids, l'ajouter
UPDATE tasks
SET assigned_to_ids = ARRAY[assigned_to_id]
WHERE assigned_to_id IS NOT NULL
  AND (
    assigned_to_ids IS NULL 
    OR assigned_to_ids = '{}'
    OR NOT (assigned_to_id = ANY(assigned_to_ids))
  );

-- 3️⃣ Vérification après synchronisation
SELECT 
  COUNT(*) FILTER (WHERE assigned_to_id IS NOT NULL AND assigned_to_id = ANY(assigned_to_ids)) as synchronisees,
  COUNT(*) FILTER (WHERE assigned_to_id IS NOT NULL AND NOT (assigned_to_id = ANY(assigned_to_ids))) as non_synchronisees,
  COUNT(*) FILTER (WHERE assigned_to_id IS NULL) as sans_assignation
FROM tasks;

-- 4️⃣ Afficher quelques exemples de tâches synchronisées
SELECT 
  id,
  title,
  assigned_to_id,
  assigned_to_ids,
  '✅ Synchronisé' as statut
FROM tasks
WHERE assigned_to_id IS NOT NULL
  AND assigned_to_id = ANY(assigned_to_ids)
LIMIT 10;
