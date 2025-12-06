-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR SYSTÈME AUTH INTERNE
-- =====================================================
-- Problème : auth.uid() ne fonctionne pas avec auth interne
-- Solution : Désactiver temporairement RLS OU créer fonction helper
-- =====================================================

-- Option 1 : DÉSACTIVER RLS (TEMPORAIRE - POUR TEST)
-- ⚠️ ATTENTION : Cela rend la table accessible à tous les utilisateurs authentifiés
-- À utiliser uniquement si vous avez d'autres contrôles d'accès au niveau applicatif

ALTER TABLE public.password_reset_requests DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Option 2 : POLITIQUE PERMISSIVE (RECOMMANDÉ)
-- =====================================================
-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Users can view own reset requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Users can create reset requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Admins can view all reset requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Gerants can view all reset requests" ON public.password_reset_requests;

-- Réactiver RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Politique permissive : Autoriser tous les utilisateurs authentifiés à lire
CREATE POLICY "Allow authenticated users to read"
  ON public.password_reset_requests
  FOR SELECT
  USING (true);

-- Politique permissive : Autoriser tous les utilisateurs authentifiés à insérer
CREATE POLICY "Allow authenticated users to insert"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Politique permissive : Autoriser tous les utilisateurs authentifiés à modifier
CREATE POLICY "Allow authenticated users to update"
  ON public.password_reset_requests
  FOR UPDATE
  USING (true);

-- Politique permissive : Autoriser tous les utilisateurs authentifiés à supprimer
CREATE POLICY "Allow authenticated users to delete"
  ON public.password_reset_requests
  FOR DELETE
  USING (true);

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Afficher les politiques actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'password_reset_requests';

-- Compter les demandes existantes
SELECT 
  status,
  COUNT(*) as count
FROM public.password_reset_requests
GROUP BY status
ORDER BY status;
