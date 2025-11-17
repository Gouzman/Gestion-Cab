-- 🔧 SCRIPT TOUT-EN-UN : Configuration complète du système d'authentification
-- Exécutez ce script dans Supabase SQL Editor pour tout configurer en une fois

-- ========================================
-- 1. CONFIRMER TOUS LES EMAILS
-- ========================================

-- Confirmer tous les comptes existants
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  confirmation_sent_at = NULL
WHERE email_confirmed_at IS NULL;

-- Créer la fonction de confirmation automatique
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmation_token = '',
    confirmation_sent_at = NULL
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger de confirmation automatique
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- ========================================
-- 2. GÉRER LA TABLE USERS ET FK
-- ========================================

-- Remplir users avec tous les comptes Auth existants
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Créer le trigger pour auto-remplir users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ========================================
-- 3. APPROUVER LES ADMINS
-- ========================================

-- Ajouter la colonne admin_approved si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false;

-- Approuver tous les admins existants
UPDATE public.profiles
SET admin_approved = true
WHERE role = 'admin';

-- Approuver spécifiquement le super admin
UPDATE public.profiles
SET admin_approved = true
WHERE email = 'elie.gouzou@gmail.com';

-- Créer le trigger pour auto-approuver les admins
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

-- ========================================
-- 4. FONCTIONS RPC
-- ========================================

-- Fonction de création de collaborateur
CREATE OR REPLACE FUNCTION public.create_collaborator(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_function TEXT
)
RETURNS JSON AS $$
DECLARE
  users_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) INTO users_table_exists;

  IF users_table_exists THEN
    INSERT INTO public.users (id, email)
    VALUES (user_id, user_email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, function, password_set, admin_approved)
  VALUES (user_id, user_email, user_name, user_role, user_function, false, false)
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    function = EXCLUDED.function,
    password_set = EXCLUDED.password_set;

  RETURN json_build_object('success', true, 'user_id', user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_collaborator TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_collaborator TO anon;

-- Fonction de mise à jour du mot de passe
CREATE OR REPLACE FUNCTION public.update_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id_var UUID;
BEGIN
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id_var IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id_var;

  RETURN json_build_object('success', true, 'user_id', user_id_var);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password TO anon;

-- Fonction de suppression d'utilisateur
CREATE OR REPLACE FUNCTION public.delete_user_account(
  user_id UUID
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = user_id;
  DELETE FROM public.users WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;

-- ========================================
-- 5. VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier les comptes confirmés
SELECT 
  'Comptes confirmés' as info,
  COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
  'Comptes non confirmés' as info,
  COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NULL
UNION ALL
SELECT 
  'Admins approuvés' as info,
  COUNT(*) as count
FROM public.profiles
WHERE admin_approved = true
UNION ALL
SELECT 
  'Utilisateurs en attente' as info,
  COUNT(*) as count
FROM public.profiles
WHERE admin_approved = false AND role != 'admin';

-- ========================================
-- ✅ CONFIGURATION TERMINÉE
-- ========================================
