-- Script pour ajouter les colonnes manquantes à la table dossier_instance existante
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes de dates si elles n'existent pas
DO $$ 
BEGIN
    -- date_introduction
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'date_introduction'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN date_introduction DATE;
        RAISE NOTICE 'Colonne date_introduction ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_introduction existe déjà';
    END IF;

    -- date_jugement
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'date_jugement'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN date_jugement DATE;
        RAISE NOTICE 'Colonne date_jugement ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_jugement existe déjà';
    END IF;

END $$;

-- Vérification des colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'dossier_instance'
ORDER BY ordinal_position;
