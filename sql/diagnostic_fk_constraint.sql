-- 🔍 Diagnostic de la contrainte FK profiles_id_fkey
-- Exécutez ce script pour comprendre le problème

-- 1. Vérifier si la table users existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles');

-- 2. Vérifier la contrainte FK sur profiles
SELECT
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Compter les enregistrements
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'public.users', COUNT(*) FROM public.users
UNION ALL
SELECT 'public.profiles', COUNT(*) FROM public.profiles;

-- 4. Vérifier les ID manquants (profiles sans users)
SELECT 
  p.id,
  p.email,
  p.name,
  CASE 
    WHEN u.id IS NULL THEN 'MISSING in users'
    ELSE 'OK'
  END as status
FROM public.profiles p
LEFT JOIN public.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 5. SOLUTION : Si la table users existe mais est vide, 
-- il faut soit :
-- A) La remplir avec les données de auth.users
-- B) Supprimer la contrainte FK
-- C) Utiliser un trigger pour remplir automatiquement

-- Option A : Remplir users depuis auth.users
-- INSERT INTO public.users (id, email)
-- SELECT id, email FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

-- Option B : Supprimer la contrainte FK (NON RECOMMANDÉ)
-- ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

-- Option C : Vérifier si le trigger existe
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname LIKE '%auth%user%';
