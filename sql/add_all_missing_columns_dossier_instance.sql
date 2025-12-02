-- Script pour ajouter TOUTES les colonnes manquantes à dossier_instance
-- À exécuter dans Supabase SQL Editor

DO $$ 
BEGIN
    -- juridiction
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'juridiction'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN juridiction TEXT;
        RAISE NOTICE '✅ Colonne juridiction ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne juridiction existe déjà';
    END IF;

    -- numero_rg
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'numero_rg'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN numero_rg TEXT;
        RAISE NOTICE '✅ Colonne numero_rg ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne numero_rg existe déjà';
    END IF;

    -- date_introduction
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'date_introduction'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN date_introduction DATE;
        RAISE NOTICE '✅ Colonne date_introduction ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne date_introduction existe déjà';
    END IF;

    -- date_jugement
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'date_jugement'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN date_jugement DATE;
        RAISE NOTICE '✅ Colonne date_jugement ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne date_jugement existe déjà';
    END IF;

    -- decision
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'decision'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN decision TEXT;
        RAISE NOTICE '✅ Colonne decision ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne decision existe déjà';
    END IF;

    -- favorable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'favorable'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN favorable BOOLEAN;
        RAISE NOTICE '✅ Colonne favorable ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne favorable existe déjà';
    END IF;

    -- statut avec valeur par défaut et contrainte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dossier_instance' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE dossier_instance ADD COLUMN statut TEXT DEFAULT 'en_cours';
        ALTER TABLE dossier_instance ADD CONSTRAINT check_statut CHECK (statut IN (
            'en_cours',
            'gagne',
            'perdu',
            'desistement',
            'transaction'
        ));
        RAISE NOTICE '✅ Colonne statut ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne statut existe déjà';
    END IF;

END $$;

-- Vérification finale de toutes les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dossier_instance'
ORDER BY ordinal_position;
