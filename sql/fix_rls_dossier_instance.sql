-- Script pour configurer les politiques RLS de dossier_instance
-- À exécuter dans Supabase SQL Editor

-- Activer RLS sur la table
ALTER TABLE dossier_instance ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow read for authenticated users" ON dossier_instance;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON dossier_instance;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON dossier_instance;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON dossier_instance;

-- Politique : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users" ON dossier_instance
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users" ON dossier_instance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique : Mise à jour pour tous les utilisateurs authentifiés
CREATE POLICY "Allow update for authenticated users" ON dossier_instance
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique : Suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users" ON dossier_instance
  FOR DELETE
  TO authenticated
  USING (true);

-- Vérification des politiques
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
WHERE tablename = 'dossier_instance';
