-- Script SQL pour ajouter la colonne password_set
-- Cette colonne indique si l'utilisateur a déjà défini son mot de passe

-- 1. Ajouter la colonne password_set si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'password_set'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN password_set BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Colonne password_set ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne password_set existe déjà';
    END IF;
END $$;

-- 2. Mettre à jour les utilisateurs existants
-- Tous les utilisateurs existants sont considérés comme ayant déjà un mot de passe
UPDATE profiles 
SET password_set = true 
WHERE password_set IS NULL;

-- 3. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN profiles.password_set IS 
'Indique si l''utilisateur a déjà défini son mot de passe lors de sa première connexion';

-- ✅ Script terminé
-- La colonne password_set est maintenant disponible dans la table profiles
