-- =====================================================
-- FONCTION : Créer un utilisateur Auth complet
-- =====================================================
-- Cette fonction utilise SECURITY DEFINER pour créer un compte Auth
-- sans envoyer d'email de confirmation (évite l'erreur 429)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_auth_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'collaborator',
  user_function TEXT DEFAULT 'Collaborateur'
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  password_hash TEXT;
  result JSON;
BEGIN
  -- 1. Vérifier si l'email existe déjà
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un utilisateur avec cet email existe déjà'
    );
  END IF;

  -- 2. Hasher le mot de passe initial
  password_hash := crypt(user_password, gen_salt('bf'));

  -- 3. Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',  -- instance_id par défaut
    gen_random_uuid(),                        -- id généré automatiquement
    'authenticated',                          -- audience
    'authenticated',                          -- role
    user_email,                               -- email
    crypt(user_password, gen_salt('bf')),    -- encrypted_password
    NOW(),                                    -- email_confirmed_at (confirmé immédiatement)
    NOW(),                                    -- confirmation_sent_at
    '',                                       -- confirmation_token (vide)
    '',                                       -- recovery_token (vide)
    '',                                       -- email_change_token_new (vide)
    '',                                       -- email_change (vide)
    json_build_object('provider', 'email', 'providers', ARRAY['email']),  -- app_meta_data
    json_build_object('name', user_name, 'role', user_role, 'function', user_function),  -- user_meta_data
    NOW(),                                    -- created_at
    NOW(),                                    -- updated_at
    false                                     -- is_super_admin
  )
  RETURNING id INTO new_user_id;

  -- 4. Créer l'identité email
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,  -- provider_id = user_id en string
    json_build_object(
      'sub', new_user_id::text,
      'email', user_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 5. Créer le profil dans public.profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    function, 
    initial_password,
    password_set, 
    must_change_password,
    has_custom_password,
    admin_approved
  )
  VALUES (
    new_user_id, 
    user_email, 
    user_name, 
    user_role, 
    user_function,
    password_hash,
    false,   -- password_set = false car c'est le mot de passe générique
    true,    -- must_change_password = true
    false,   -- has_custom_password = false
    false    -- admin_approved = false (validation par admin requise)
  );

  -- 6. Retourner le résultat avec le mot de passe en clair
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'initial_password', user_password
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un utilisateur avec cet email existe déjà'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_auth_user_with_profile TO authenticated;

-- Test de la fonction
SELECT 
  '✅ Fonction create_auth_user_with_profile créée avec succès' as message,
  'Cette fonction crée un compte Auth + Profile sans envoyer d''email' as description;
