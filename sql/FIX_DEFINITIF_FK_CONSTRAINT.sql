-- 🔧 CORRECTION DÉFINITIVE : Résoudre profiles_id_fkey
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Remplir la table users avec tous les comptes Auth existants
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 2. Créer/Recréer la fonction trigger pour auto-remplir users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer automatiquement dans public.users
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Vérification
SELECT 
  'auth.users' as source,
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'public.users' as source,
  COUNT(*) as count 
FROM public.users;

-- 6. Afficher les éventuels ID manquants
SELECT 
  au.id,
  au.email,
  'Missing in public.users' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
