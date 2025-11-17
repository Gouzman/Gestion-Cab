-- 🔧 Correction urgente : politique RLS sur users
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Supprimer l'ancienne politique qui bloque
DROP POLICY IF EXISTS "Only admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins and service can insert users" ON public.users;

-- 2. Créer une politique permissive pour les admins
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Permettre au trigger (SECURITY DEFINER) d'insérer
-- Le trigger utilise SECURITY DEFINER donc il bypass RLS automatiquement
-- On peut aussi désactiver RLS sur users si vous préférez :
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Vérification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users';
