-- Ajouter la colonne admin_approved pour valider les utilisateurs
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Ajouter la colonne admin_approved dans profiles
-- Les admins sont approuvés par défaut, les autres non
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false;

-- 2. Valider automatiquement TOUS les admins (existants et futurs)
UPDATE public.profiles
SET admin_approved = true
WHERE role = 'admin';

-- 3. S'assurer que le super admin elie.gouzou@gmail.com est approuvé
UPDATE public.profiles
SET admin_approved = true
WHERE email = 'elie.gouzou@gmail.com';

-- 4. Créer un trigger pour auto-approuver les admins
CREATE OR REPLACE FUNCTION public.auto_approve_admins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    NEW.admin_approved := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_approve_admins ON public.profiles;
CREATE TRIGGER trigger_auto_approve_admins
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_admins();

-- 3. Créer un index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_admin_approved 
ON public.profiles(admin_approved);

COMMENT ON COLUMN public.profiles.admin_approved IS 'Indique si l''admin a validé ce collaborateur';
