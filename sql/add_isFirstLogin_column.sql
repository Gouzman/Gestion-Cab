-- Script SQL optionnel pour ajouter la colonne isFirstLogin
-- Utilisé pour gérer les premières connexions des utilisateurs

-- 1. Ajouter la colonne isFirstLogin si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'isFirstLogin'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN "isFirstLogin" boolean DEFAULT false;
        
        RAISE NOTICE 'Colonne isFirstLogin ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne isFirstLogin existe déjà';
    END IF;
END $$;

-- 2. Mettre à jour les utilisateurs existants (optionnel)
-- Tous les utilisateurs existants sont considérés comme ayant déjà fait leur première connexion
UPDATE profiles 
SET "isFirstLogin" = false 
WHERE "isFirstLogin" IS NULL;

-- 3. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN profiles."isFirstLogin" IS 
'Indique si l''utilisateur doit définir son mot de passe lors de sa première connexion';

-- ✅ Script terminé
-- La colonne isFirstLogin est maintenant disponible dans la table profiles
