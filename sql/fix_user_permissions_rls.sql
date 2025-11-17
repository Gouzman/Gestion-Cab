-- ============================================
-- FIX RLS pour la table user_permissions
-- ============================================
-- Ce script corrige la violation RLS lors de l'insertion/mise à jour
-- des permissions utilisateur.
--
-- ERREURS CORRIGÉES :
-- 1. "new row violates row-level security policy for table user_permissions"
-- 2. "record new has no field updated_at"
--
-- SOLUTION :
-- 1. Ajouter des policies permettant aux utilisateurs authentifiés
--    d'insérer ou mettre à jour leur propre ligne de permissions.
-- 2. Supprimer le trigger automatique qui essaie de mettre à jour
--    la colonne updated_at (qui n'existe pas dans la table actuelle)
-- ============================================

-- Étape 1 : Supprimer TOUS les triggers qui pourraient modifier updated_at
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
DROP TRIGGER IF EXISTS update_updated_at ON user_permissions;
DROP TRIGGER IF EXISTS set_updated_at ON user_permissions;
DROP TRIGGER IF EXISTS handle_updated_at ON user_permissions;

-- Étape 2 : Vérifier et afficher les triggers restants (pour debug)
-- Vous pouvez commenter cette ligne après vérification
SELECT tgname FROM pg_trigger WHERE tgrelid = 'user_permissions'::regclass;

-- Étape 3 : S'assurer que RLS est activé
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "allow_insert_own_permissions" ON user_permissions;
DROP POLICY IF EXISTS "allow_update_own_permissions" ON user_permissions;
DROP POLICY IF EXISTS "allow_select_own_permissions" ON user_permissions;

-- Policy pour permettre la lecture de ses propres permissions
CREATE POLICY "allow_select_own_permissions" ON user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy pour permettre l'insertion de ses propres permissions
CREATE POLICY "allow_insert_own_permissions" ON user_permissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy pour permettre la mise à jour de ses propres permissions
CREATE POLICY "allow_update_own_permissions" ON user_permissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vérification : afficher les policies actives
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_permissions';
