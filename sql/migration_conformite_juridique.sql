-- ========================================
-- MIGRATION - CONFORMITÉ PROCÉDURES JURIDIQUES
-- Date : 28 novembre 2025
-- Description : Mise en conformité avec les procédures de gestion de dossiers juridiques
-- ========================================

-- ========================================
-- 1️⃣ NUMÉRO CLIENT (code_client avec génération automatique)
-- ========================================

-- Vérifier si la colonne client_code existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'client_code'
  ) THEN
    -- Ajouter la colonne client_code
    ALTER TABLE clients ADD COLUMN client_code TEXT;
    
    -- Générer les codes clients pour les clients existants selon la règle AA.NNN
    -- AA = numéro de la lettre du nom (A=01, B=02, ..., Z=26)
    -- NNN = numéro d'ordre incrémenté par lettre
    WITH client_with_letter AS (
      SELECT 
        id,
        type,
        name,
        UPPER(SUBSTRING(COALESCE(name, 'A') FROM 1 FOR 1)) as first_letter,
        ROW_NUMBER() OVER (
          PARTITION BY UPPER(SUBSTRING(COALESCE(name, 'A') FROM 1 FOR 1))
          ORDER BY created_at
        ) as row_num
      FROM clients
      WHERE client_code IS NULL
    )
    UPDATE clients
    SET client_code = (
      SELECT 
        LPAD((ASCII(first_letter) - 64)::TEXT, 2, '0') || '.' || 
        LPAD(row_num::TEXT, 3, '0')
      FROM client_with_letter
      WHERE client_with_letter.id = clients.id
    )
    WHERE client_code IS NULL;
    
    -- Rendre la colonne unique (mais pas NOT NULL pour permettre génération par trigger)
    ALTER TABLE clients ADD CONSTRAINT clients_client_code_unique UNIQUE (client_code);
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX idx_clients_client_code ON clients(client_code);
    
    -- Commentaire pour documentation
    COMMENT ON COLUMN clients.client_code IS 'Numéro client au format AA.NNN (AA=lettre du nom, NNN=numéro d''ordre)';
  END IF;
END $$;

-- ========================================
-- 2️⃣ NUMÉRO DOSSIER (code_dossier + id_dossier)
-- ========================================

-- Ajouter id_dossier auto-incrémenté (séquence interne)
DO $$
BEGIN
  -- Créer une séquence dédiée si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'cases_id_dossier_seq') THEN
    CREATE SEQUENCE cases_id_dossier_seq START WITH 1 INCREMENT BY 1;
  END IF;

  -- Ajouter la colonne id_dossier si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' 
    AND column_name = 'id_dossier'
  ) THEN
    ALTER TABLE cases ADD COLUMN id_dossier INTEGER DEFAULT nextval('cases_id_dossier_seq') NOT NULL;
    CREATE UNIQUE INDEX idx_cases_id_dossier ON cases(id_dossier);
    COMMENT ON COLUMN cases.id_dossier IS 'Identifiant numérique auto-incrémenté interne (non affiché aux utilisateurs)';
  END IF;
END $$;

-- Vérifier et ajuster code_dossier (déjà créé par migration précédente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' 
    AND column_name = 'code_dossier'
  ) THEN
    ALTER TABLE cases ADD COLUMN code_dossier TEXT;
    COMMENT ON COLUMN cases.code_dossier IS 'Code du dossier saisi par l''utilisateur (manuel)';
  END IF;
END $$;

-- ========================================
-- 3️⃣ CATÉGORIES DE DOCUMENTS
-- ========================================

-- Ajouter la colonne document_category dans la table des documents
-- Note: La structure peut varier selon votre implémentation (tasks_files ou documents)

-- Pour tasks_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks_files' 
    AND column_name = 'document_category'
  ) THEN
    ALTER TABLE tasks_files ADD COLUMN document_category TEXT;
    COMMENT ON COLUMN tasks_files.document_category IS 'Catégorie du document : Documents de suivi et facturation, Pièces, Écritures, Courriers, Observations et notes';
  END IF;
END $$;

-- Pour la table documents (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'documents' 
      AND column_name = 'document_category'
    ) THEN
      ALTER TABLE documents ADD COLUMN document_category TEXT;
      COMMENT ON COLUMN documents.document_category IS 'Catégorie du document : Documents de suivi et facturation, Pièces, Écritures, Courriers, Observations et notes';
    END IF;
  END IF;
END $$;

-- ========================================
-- 4️⃣ INSTANCES JURIDIQUES (CONTENTIEUX)
-- ========================================

-- Créer la table dossier_instance pour gérer les procédures judiciaires
CREATE TABLE IF NOT EXISTS dossier_instance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Champs obligatoires
  instance_type TEXT NOT NULL CHECK (instance_type IN ('Tribunal', 'Appel', 'Cassation')),
  juridiction_competente TEXT NOT NULL,
  etat_du_dossier TEXT NOT NULL,
  date_ouverture DATE NOT NULL,
  
  -- Champs optionnels
  date_cloture DATE,
  numero_rg TEXT, -- Numéro de répertoire général
  observations TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_dossier_instance_case_id ON dossier_instance(case_id);
CREATE INDEX IF NOT EXISTS idx_dossier_instance_type ON dossier_instance(instance_type);
CREATE INDEX IF NOT EXISTS idx_dossier_instance_date_ouverture ON dossier_instance(date_ouverture);

-- Commentaires
COMMENT ON TABLE dossier_instance IS 'Instances et procédures judiciaires liées aux dossiers';
COMMENT ON COLUMN dossier_instance.instance_type IS 'Type d''instance : Tribunal, Appel ou Cassation';
COMMENT ON COLUMN dossier_instance.juridiction_competente IS 'Nom de la juridiction compétente';
COMMENT ON COLUMN dossier_instance.etat_du_dossier IS 'État actuel du dossier dans cette instance';

-- RLS pour dossier_instance
ALTER TABLE dossier_instance ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les instances des dossiers auxquels ils ont accès
DROP POLICY IF EXISTS "Users can view instances of accessible cases" ON dossier_instance;
CREATE POLICY "Users can view instances of accessible cases"
  ON dossier_instance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = dossier_instance.case_id
      AND (
        cases.created_by = auth.uid() 
        OR auth.uid() = ANY(cases.visible_to)
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Politique : Les créateurs de dossiers et admins peuvent créer des instances
DROP POLICY IF EXISTS "Case creators and admins can create instances" ON dossier_instance;
CREATE POLICY "Case creators and admins can create instances"
  ON dossier_instance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = dossier_instance.case_id
      AND (
        cases.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Politique : Les créateurs de dossiers et admins peuvent modifier des instances
DROP POLICY IF EXISTS "Case creators and admins can update instances" ON dossier_instance;
CREATE POLICY "Case creators and admins can update instances"
  ON dossier_instance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = dossier_instance.case_id
      AND (
        cases.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Politique : Les créateurs de dossiers et admins peuvent supprimer des instances
DROP POLICY IF EXISTS "Case creators and admins can delete instances" ON dossier_instance;
CREATE POLICY "Case creators and admins can delete instances"
  ON dossier_instance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = dossier_instance.case_id
      AND (
        cases.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- ========================================
-- 5️⃣ AUTRES CHAMPS DOSSIERS
-- ========================================

-- Ajouter objet_du_dossier (différent de description)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS objet_du_dossier TEXT;
COMMENT ON COLUMN cases.objet_du_dossier IS 'Objet juridique du dossier (différent de la description)';

-- Ajouter type_de_diligence (liste déroulante)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type_de_diligence TEXT;
COMMENT ON COLUMN cases.type_de_diligence IS 'Type de diligence : Consultation, Contentieux, Conseil, Rédaction, etc.';

-- Ajouter qualité_du_client
ALTER TABLE cases ADD COLUMN IF NOT EXISTS qualite_du_client TEXT CHECK (qualite_du_client IN ('personne_physique', 'personne_morale'));
COMMENT ON COLUMN cases.qualite_du_client IS 'Qualité du client : personne physique ou personne morale';

-- ========================================
-- 6️⃣ INDEX SUPPLÉMENTAIRES
-- ========================================

-- Index pour améliorer les recherches sur les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_cases_objet_du_dossier ON cases USING gin (to_tsvector('french', objet_du_dossier));
CREATE INDEX IF NOT EXISTS idx_cases_type_de_diligence ON cases(type_de_diligence);
CREATE INDEX IF NOT EXISTS idx_cases_qualite_du_client ON cases(qualite_du_client);

-- ========================================
-- 7️⃣ FONCTION DE GÉNÉRATION AUTOMATIQUE CODE CLIENT
-- ========================================

-- Fonction pour générer automatiquement le code_client lors de l'insertion
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
DECLARE
  letter_code INTEGER;
  first_letter TEXT;
  next_number INTEGER;
BEGIN
  -- Extraire la première lettre du nom (ou 'A' par défaut)
  first_letter := UPPER(SUBSTRING(COALESCE(NEW.name, 'A') FROM 1 FOR 1));
  
  -- Calculer le code de la lettre (A=01, B=02, ..., Z=26)
  letter_code := ASCII(first_letter) - 64;
  
  -- Si la lettre n'est pas alphabétique, utiliser 01
  IF letter_code < 1 OR letter_code > 26 THEN
    letter_code := 1;
  END IF;
  
  -- Trouver le prochain numéro pour cette lettre
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(client_code FROM POSITION('.' IN client_code) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM clients
  WHERE client_code LIKE LPAD(letter_code::TEXT, 2, '0') || '.%';
  
  -- Générer le code au format AA.NNN
  NEW.client_code := LPAD(letter_code::TEXT, 2, '0') || '.' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour générer automatiquement le code_client
DROP TRIGGER IF EXISTS trigger_generate_client_code ON clients;
CREATE TRIGGER trigger_generate_client_code
  BEFORE INSERT ON clients
  FOR EACH ROW
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION generate_client_code();

-- ========================================
-- 8️⃣ FONCTION DE MISE À JOUR DES TIMESTAMPS
-- ========================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger updated_at sur dossier_instance
DROP TRIGGER IF EXISTS update_dossier_instance_updated_at ON dossier_instance;
CREATE TRIGGER update_dossier_instance_updated_at
  BEFORE UPDATE ON dossier_instance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ✅ FIN DE LA MIGRATION
-- ========================================

-- Afficher un résumé de la migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '📋 Résumé des modifications :';
  RAISE NOTICE '  ✔ Code client avec génération automatique (AA.NNN)';
  RAISE NOTICE '  ✔ Code dossier (saisi manuellement) + id_dossier (auto-incrémenté)';
  RAISE NOTICE '  ✔ Catégories de documents ajoutées';
  RAISE NOTICE '  ✔ Table dossier_instance créée pour les procédures judiciaires';
  RAISE NOTICE '  ✔ Nouveaux champs dossiers : objet_du_dossier, type_de_diligence, qualite_du_client';
  RAISE NOTICE '  ✔ Index et contraintes créés';
  RAISE NOTICE '  ✔ Triggers et fonctions configurés';
END $$;
