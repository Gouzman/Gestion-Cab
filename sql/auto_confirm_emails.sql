-- 🔧 Auto-confirmer les emails lors de la création de compte
-- Exécutez ce script dans Supabase SQL Editor

-- Fonction pour auto-confirmer l'email d'un utilisateur
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Confirmer automatiquement l'email
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    confirmation_token = '',
    confirmation_sent_at = NULL
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users (après insertion)
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- Confirmer les utilisateurs existants non confirmés
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  confirmation_sent_at = NULL
WHERE email_confirmed_at IS NULL;
