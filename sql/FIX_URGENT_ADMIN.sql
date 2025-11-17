-- 🚨 CORRECTION URGENTE : Débloquer le super admin
-- Exécutez ce script EN PREMIER dans Supabase SQL Editor

-- 1. Approuver le compte super admin
UPDATE public.profiles
SET admin_approved = true
WHERE email = 'elie.gouzou@gmail.com';

-- 2. Approuver TOUS les admins
UPDATE public.profiles
SET admin_approved = true
WHERE role = 'admin';

-- 3. Vérification
SELECT 
  email, 
  role, 
  admin_approved,
  password_set
FROM public.profiles
WHERE email = 'elie.gouzou@gmail.com';
