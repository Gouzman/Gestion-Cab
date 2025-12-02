-- ========================================
-- DOSSIERS LIÉS ET AVIS JURIDIQUES
-- Date : 2 décembre 2025
-- Description : 
--   1. Regroupement de dossiers liés (affaires non contentieuses)
--   2. Chemise virtuelle "Avis juridiques" pour clients conventionnés
-- ========================================

-- ========================================
-- 1️⃣ DOSSIERS LIÉS (Point 79)
-- ========================================
-- Pour affaires non contentieuses : conseil, rédaction, Corporate, audit, fiscalité
-- Possibilité de regrouper des dossiers liés dans une "chemise à sangle virtuelle"

-- Ajouter la colonne parent_case_id pour créer une hiérarchie
ALTER TABLE cases ADD COLUMN IF NOT EXISTS parent_case_id UUID REFERENCES cases(id) ON DELETE SET NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_groupe BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS groupe_name TEXT;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cases_parent_case_id ON cases(parent_case_id);
CREATE INDEX IF NOT EXISTS idx_cases_is_groupe ON cases(is_groupe);

-- Commentaires
COMMENT ON COLUMN cases.parent_case_id IS 'Référence au dossier parent pour regrouper des dossiers liés (chemise à sangle virtuelle)';
COMMENT ON COLUMN cases.is_groupe IS 'Indique si ce dossier est un groupe/conteneur pour d''autres dossiers';
COMMENT ON COLUMN cases.groupe_name IS 'Nom du groupe de dossiers (ex: "Audit fiscal 2025 - Société ABC")';

-- ========================================
-- 2️⃣ AVIS JURIDIQUES ANNUELS (Point 80)
-- ========================================
-- Pour clients conventionnés : chemise à sangle annuelle pour avis/consultations

-- Table pour gérer les avis juridiques annuels des clients conventionnés
CREATE TABLE IF NOT EXISTS avis_juridiques_annuels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  nom_chemise TEXT NOT NULL, -- Ex: "Avis juridiques 2025 - KOFFI (11.001)"
  description TEXT,
  nombre_consultations INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contrainte : un seul dossier d'avis par client et par année
  CONSTRAINT unique_client_annee UNIQUE (client_id, annee)
);

-- Lier les consultations/avis à la chemise annuelle
ALTER TABLE cases ADD COLUMN IF NOT EXISTS avis_annuel_id UUID REFERENCES avis_juridiques_annuels(id) ON DELETE SET NULL;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_avis_juridiques_client_id ON avis_juridiques_annuels(client_id);
CREATE INDEX IF NOT EXISTS idx_avis_juridiques_annee ON avis_juridiques_annuels(annee);
CREATE INDEX IF NOT EXISTS idx_cases_avis_annuel_id ON cases(avis_annuel_id);

-- Commentaires
COMMENT ON TABLE avis_juridiques_annuels IS 'Chemises virtuelles annuelles pour les avis juridiques des clients conventionnés';
COMMENT ON COLUMN avis_juridiques_annuels.nom_chemise IS 'Nom de la chemise : "Avis juridiques [ANNÉE] - [NOM CLIENT] ([N° CLIENT])"';
COMMENT ON COLUMN cases.avis_annuel_id IS 'Référence à la chemise annuelle d''avis juridiques (pour consultations de clients conventionnés)';

-- ========================================
-- 3️⃣ FONCTION AUTO-CRÉATION CHEMISE AVIS ANNUELS
-- ========================================

-- Fonction pour créer ou récupérer la chemise d'avis annuels d'un client
CREATE OR REPLACE FUNCTION get_or_create_avis_annuel(
  p_client_id UUID,
  p_annee INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_annee INTEGER;
  v_avis_id UUID;
  v_client_code TEXT;
  v_client_name TEXT;
  v_nom_chemise TEXT;
BEGIN
  -- Utiliser l'année courante si non spécifiée
  v_annee := COALESCE(p_annee, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Récupérer les infos du client
  SELECT client_code, name INTO v_client_code, v_client_name
  FROM clients
  WHERE id = p_client_id;
  
  -- Construire le nom de la chemise
  v_nom_chemise := 'Avis juridiques ' || v_annee || ' - ' || v_client_name || 
                   COALESCE(' (' || v_client_code || ')', '');
  
  -- Récupérer ou créer la chemise
  INSERT INTO avis_juridiques_annuels (client_id, annee, nom_chemise)
  VALUES (p_client_id, v_annee, v_nom_chemise)
  ON CONFLICT (client_id, annee) 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_avis_id;
  
  RETURN v_avis_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_avis_annuel IS 'Crée ou récupère la chemise annuelle d''avis juridiques pour un client conventionné';

-- ========================================
-- 4️⃣ TRIGGER AUTO-COMPTAGE CONSULTATIONS
-- ========================================

-- Mettre à jour le compteur de consultations
CREATE OR REPLACE FUNCTION update_avis_annuel_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.avis_annuel_id IS NOT NULL THEN
    UPDATE avis_juridiques_annuels
    SET nombre_consultations = (
      SELECT COUNT(*) FROM cases WHERE avis_annuel_id = NEW.avis_annuel_id
    ),
    updated_at = now()
    WHERE id = NEW.avis_annuel_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_avis_count ON cases;
CREATE TRIGGER trigger_update_avis_count
  AFTER INSERT OR UPDATE OF avis_annuel_id OR DELETE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_avis_annuel_count();

-- ========================================
-- 5️⃣ RLS (Row Level Security)
-- ========================================

-- Activer RLS sur la table avis_juridiques_annuels
ALTER TABLE avis_juridiques_annuels ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les avis des clients auxquels ils ont accès
DROP POLICY IF EXISTS "Users can view avis for accessible clients" ON avis_juridiques_annuels;
CREATE POLICY "Users can view avis for accessible clients"
  ON avis_juridiques_annuels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.client_id = avis_juridiques_annuels.client_id
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
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les utilisateurs authentifiés peuvent créer des avis
DROP POLICY IF EXISTS "Authenticated users can create avis" ON avis_juridiques_annuels;
CREATE POLICY "Authenticated users can create avis"
  ON avis_juridiques_annuels FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Politique : Les créateurs et admins peuvent modifier
DROP POLICY IF EXISTS "Creators and admins can update avis" ON avis_juridiques_annuels;
CREATE POLICY "Creators and admins can update avis"
  ON avis_juridiques_annuels FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les créateurs et admins peuvent supprimer
DROP POLICY IF EXISTS "Creators and admins can delete avis" ON avis_juridiques_annuels;
CREATE POLICY "Creators and admins can delete avis"
  ON avis_juridiques_annuels FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 6️⃣ VUES UTILES
-- ========================================

-- Vue : Dossiers groupés avec leurs enfants
CREATE OR REPLACE VIEW v_dossiers_groupes AS
SELECT 
  parent.id as groupe_id,
  parent.groupe_name,
  parent.code_dossier as code_groupe,
  COUNT(enfant.id) as nombre_dossiers,
  STRING_AGG(enfant.code_dossier, ', ' ORDER BY enfant.created_at) as dossiers_inclus,
  parent.created_at as date_creation
FROM cases parent
LEFT JOIN cases enfant ON enfant.parent_case_id = parent.id
WHERE parent.is_groupe = true
GROUP BY parent.id, parent.groupe_name, parent.code_dossier, parent.created_at;

COMMENT ON VIEW v_dossiers_groupes IS 'Vue des dossiers groupés (chemises à sangle) avec leurs dossiers enfants';

-- Vue : Avis juridiques par client avec détails
CREATE OR REPLACE VIEW v_avis_juridiques_clients AS
SELECT 
  aja.id,
  aja.annee,
  aja.nom_chemise,
  aja.nombre_consultations,
  c.client_code,
  c.name as client_name,
  c.is_conventionne,
  c.type_convention,
  c.organisme_convention,
  aja.created_at,
  aja.updated_at
FROM avis_juridiques_annuels aja
JOIN clients c ON c.id = aja.client_id;

COMMENT ON VIEW v_avis_juridiques_clients IS 'Vue des chemises d''avis juridiques avec informations clients';

-- ========================================
-- 7️⃣ TESTS
-- ========================================

DO $$
DECLARE
  test_client_id UUID;
  test_avis_id UUID;
  test_groupe_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 TESTS DES NOUVELLES FONCTIONNALITÉS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  -- Test 1 : Dossiers liés
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ TEST DOSSIERS LIÉS';
  SELECT id INTO test_client_id FROM clients WHERE is_conventionne = true LIMIT 1;
  
  IF test_client_id IS NULL THEN
    SELECT id INTO test_client_id FROM clients LIMIT 1;
  END IF;
  
  IF test_client_id IS NOT NULL THEN
    -- Créer un groupe
    INSERT INTO cases (title, code_dossier, client_id, is_groupe, groupe_name, status, created_by)
    VALUES (
      'Groupe Audit Fiscal 2025',
      'GRP-25.01',
      test_client_id,
      true,
      'Audit fiscal et juridique 2025 - Société ABC',
      'en-cours',
      (SELECT id FROM auth.users LIMIT 1)
    )
    RETURNING id INTO test_groupe_id;
    
    -- Créer 2 dossiers liés
    INSERT INTO cases (title, client_id, parent_case_id, type_de_diligence, status, created_by)
    VALUES 
      ('Audit fiscal Q1', test_client_id, test_groupe_id, 'Conseil', 'en-cours', (SELECT id FROM auth.users LIMIT 1)),
      ('Audit juridique Q1', test_client_id, test_groupe_id, 'Conseil', 'en-cours', (SELECT id FROM auth.users LIMIT 1));
    
    RAISE NOTICE '   ✅ Groupe créé avec 2 dossiers liés';
    RAISE NOTICE '   📁 ID Groupe : %', test_groupe_id;
    
    -- Nettoyer
    DELETE FROM cases WHERE id = test_groupe_id OR parent_case_id = test_groupe_id;
  ELSE
    RAISE NOTICE '   ⚠️ Aucun client pour le test';
  END IF;
  
  -- Test 2 : Avis juridiques annuels
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ TEST AVIS JURIDIQUES ANNUELS';
  SELECT id INTO test_client_id FROM clients WHERE is_conventionne = true LIMIT 1;
  
  IF test_client_id IS NOT NULL THEN
    -- Créer/récupérer chemise annuelle
    SELECT get_or_create_avis_annuel(test_client_id, 2025) INTO test_avis_id;
    RAISE NOTICE '   ✅ Chemise avis 2025 créée';
    RAISE NOTICE '   📂 ID Chemise : %', test_avis_id;
    
    -- Nettoyer
    DELETE FROM avis_juridiques_annuels WHERE id = test_avis_id;
  ELSE
    RAISE NOTICE '   ⚠️ Aucun client conventionné pour le test';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ========================================
-- 8️⃣ RÉSUMÉ
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 FONCTIONNALITÉS AJOUTÉES :';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ DOSSIERS LIÉS (Point 79)';
  RAISE NOTICE '   • Champ parent_case_id pour hiérarchie';
  RAISE NOTICE '   • Champ is_groupe pour identifier les conteneurs';
  RAISE NOTICE '   • Champ groupe_name pour nommer le groupe';
  RAISE NOTICE '   • Vue v_dossiers_groupes pour visualisation';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ AVIS JURIDIQUES ANNUELS (Point 80)';
  RAISE NOTICE '   • Table avis_juridiques_annuels créée';
  RAISE NOTICE '   • Fonction get_or_create_avis_annuel()';
  RAISE NOTICE '   • Compteur automatique de consultations';
  RAISE NOTICE '   • Champ avis_annuel_id dans cases';
  RAISE NOTICE '   • Vue v_avis_juridiques_clients';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SÉCURITÉ :';
  RAISE NOTICE '   • RLS activé sur avis_juridiques_annuels';
  RAISE NOTICE '   • Policies SELECT/INSERT/UPDATE/DELETE configurées';
  RAISE NOTICE '';
  RAISE NOTICE '📊 VUES CRÉÉES :';
  RAISE NOTICE '   • v_dossiers_groupes';
  RAISE NOTICE '   • v_avis_juridiques_clients';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PROCHAINE ÉTAPE :';
  RAISE NOTICE '   Mettre à jour l''interface React pour utiliser ces fonctionnalités';
  RAISE NOTICE '';
END $$;

-- Afficher les nouvelles colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cases'
  AND column_name IN ('parent_case_id', 'is_groupe', 'groupe_name', 'avis_annuel_id')
ORDER BY column_name;
