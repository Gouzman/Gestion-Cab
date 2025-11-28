-- ============================================
-- Correction des policies RLS pour la table tasks
-- Date : 27 novembre 2025
-- Objectif : Autoriser INSERT/UPDATE/DELETE avec les nouvelles colonnes
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- ============================================
-- POLICY 1 : INSERT (Création de tâches)
-- ============================================
-- Tout utilisateur authentifié peut créer une tâche
CREATE POLICY "Users can insert tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- POLICY 2 : SELECT (Lecture de tâches)
-- ============================================
-- Un utilisateur peut voir une tâche si :
-- - Il l'a créée (created_by_id)
-- - Elle lui est assignée (assigned_to_id ou dans assigned_to_ids)
-- - Il est dans la liste de visibilité (visible_by_ids)
-- - Il est admin/gérant (via son rôle dans profiles)
CREATE POLICY "Users can view tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by_id 
  OR auth.uid() = assigned_to_id
  OR auth.uid() = ANY(assigned_to_ids)
  OR auth.uid() = ANY(visible_by_ids)
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.function IN ('Gerant', 'Associe Emerite'))
  )
);

-- ============================================
-- POLICY 3 : UPDATE (Modification de tâches)
-- ============================================
-- Un utilisateur peut modifier une tâche si :
-- - Il l'a créée
-- - Elle lui est assignée
-- - Il est admin/gérant
CREATE POLICY "Users can update tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by_id 
  OR auth.uid() = assigned_to_id
  OR auth.uid() = ANY(assigned_to_ids)
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.function IN ('Gerant', 'Associe Emerite'))
  )
)
WITH CHECK (
  auth.uid() = created_by_id 
  OR auth.uid() = assigned_to_id
  OR auth.uid() = ANY(assigned_to_ids)
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.function IN ('Gerant', 'Associe Emerite'))
  )
);

-- ============================================
-- POLICY 4 : DELETE (Suppression de tâches)
-- ============================================
-- Un utilisateur peut supprimer une tâche si :
-- - Il l'a créée
-- - Il est admin/gérant
CREATE POLICY "Users can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.function IN ('Gerant', 'Associe Emerite'))
  )
);

-- ============================================
-- Vérification des policies
-- ============================================
-- Pour voir les policies créées :
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'tasks';
