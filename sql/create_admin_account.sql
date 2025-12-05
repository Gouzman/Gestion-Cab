-- =====================================================
-- CRÉATION MANUELLE DU COMPTE ADMIN
-- =====================================================
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1️⃣ Générer un UUID (vous pouvez remplacer par un UUID spécifique)
DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  admin_email TEXT := 'elie.gouzou@gmail.com';
  admin_password TEXT := 'Gouzman*1990';
  admin_password_hash TEXT;
BEGIN
  -- Note: Le hash du mot de passe doit être généré avec bcrypt
  -- Pour 'Gouzman*1990', utilisez un service en ligne ou votre backend
  -- Ou changez le mot de passe après la création
  
  RAISE NOTICE 'UUID généré: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  
  -- 2️⃣ Insérer dans auth.users (nécessite des privilèges admin)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    role,
    aud,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    crypt(admin_password, gen_salt('bf')), -- Hash bcrypt du mot de passe
    now(),
    now(),
    now(),
    '',
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrateur"}'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 3️⃣ Insérer dans public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    function,
    password_set,
    admin_approved,
    must_change_password,
    has_custom_password
  )
  VALUES (
    admin_user_id,
    admin_email,
    'Elie Gouzou',
    'admin',
    'Administrateur',
    true,
    true,
    false,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    function = EXCLUDED.function,
    password_set = true,
    admin_approved = true,
    must_change_password = false,
    has_custom_password = true;
  
  RAISE NOTICE '✅ Compte Admin créé avec succès!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Mot de passe: %', admin_password;
  
END $$;

-- Vérifier la création
SELECT id, email, name, role, admin_approved, password_set
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
