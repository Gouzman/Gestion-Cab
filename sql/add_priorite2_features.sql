-- ========================================
-- PRIORITÉ 2 - FONCTIONNALITÉS COMPLÉMENTAIRES
-- Date : 2 décembre 2025
-- Description : 
--   1. Champ numero_cabinet_instruction
--   2. Workflow attribution Secrétariat
--   3. Préparation pour étiquettes chemises physiques
-- ========================================

-- ========================================
-- 1️⃣ NUMÉRO CABINET D'INSTRUCTION (Point 76)
-- ========================================

-- Ajouter le champ numero_cabinet_instruction
ALTER TABLE cases ADD COLUMN IF NOT EXISTS numero_cabinet_instruction TEXT;
ALTER TABLE dossier_instance ADD COLUMN IF NOT EXISTS numero_cabinet_instruction TEXT;

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_cases_numero_cabinet ON cases(numero_cabinet_instruction);
CREATE INDEX IF NOT EXISTS idx_dossier_instance_numero_cabinet ON dossier_instance(numero_cabinet_instruction);

-- Commentaires
COMMENT ON COLUMN cases.numero_cabinet_instruction IS 'Numéro du cabinet d''instruction pour les affaires contentieuses';
COMMENT ON COLUMN dossier_instance.numero_cabinet_instruction IS 'Numéro du cabinet d''instruction pour cette instance';

-- ========================================
-- 2️⃣ WORKFLOW SECRÉTARIAT (Point 75)
-- ========================================

-- Table pour gérer le workflow d'attribution des numéros
CREATE TABLE IF NOT EXISTS workflow_attribution_numeros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Référence au dossier
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Statut du workflow
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente',      -- Fiche de création transmise, en attente d'attribution
    'en_traitement',   -- Secrétariat en train de traiter
    'attribue',        -- Numéros attribués
    'rejete'           -- Rejeté (besoin d'informations complémentaires)
  )),
  
  -- Informations
  demande_par UUID REFERENCES auth.users(id),
  traite_par UUID REFERENCES auth.users(id),
  date_demande TIMESTAMPTZ DEFAULT now(),
  date_traitement TIMESTAMPTZ,
  
  -- Numéros attribués
  numero_client_attribue TEXT,
  numero_dossier_attribue TEXT,
  
  -- Notes
  notes_demande TEXT,
  notes_secretariat TEXT,
  motif_rejet TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_case_id ON workflow_attribution_numeros(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statut ON workflow_attribution_numeros(statut);
CREATE INDEX IF NOT EXISTS idx_workflow_demande_par ON workflow_attribution_numeros(demande_par);
CREATE INDEX IF NOT EXISTS idx_workflow_traite_par ON workflow_attribution_numeros(traite_par);

-- Commentaires
COMMENT ON TABLE workflow_attribution_numeros IS 'Workflow pour l''attribution des numéros client/dossier par le Secrétariat';
COMMENT ON COLUMN workflow_attribution_numeros.statut IS 'État de la demande : en_attente, en_traitement, attribue, rejete';

-- ========================================
-- 3️⃣ FONCTION DEMANDE ATTRIBUTION
-- ========================================

-- Fonction pour créer une demande d'attribution de numéros
CREATE OR REPLACE FUNCTION demander_attribution_numeros(
  p_case_id UUID,
  p_notes_demande TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur courant
  v_user_id := auth.uid();
  
  -- Vérifier qu'une demande n'existe pas déjà pour ce dossier
  SELECT id INTO v_workflow_id
  FROM workflow_attribution_numeros
  WHERE case_id = p_case_id
    AND statut IN ('en_attente', 'en_traitement')
  LIMIT 1;
  
  IF v_workflow_id IS NOT NULL THEN
    RAISE EXCEPTION 'Une demande d''attribution est déjà en cours pour ce dossier';
  END IF;
  
  -- Créer la demande
  INSERT INTO workflow_attribution_numeros (
    case_id,
    demande_par,
    notes_demande,
    statut
  )
  VALUES (
    p_case_id,
    v_user_id,
    p_notes_demande,
    'en_attente'
  )
  RETURNING id INTO v_workflow_id;
  
  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION demander_attribution_numeros IS 'Crée une demande d''attribution de numéros au Secrétariat';

-- ========================================
-- 4️⃣ FONCTION TRAITER ATTRIBUTION (Secrétariat)
-- ========================================

-- Fonction pour traiter une demande (réservée au Secrétariat)
CREATE OR REPLACE FUNCTION traiter_attribution_numeros(
  p_workflow_id UUID,
  p_action TEXT, -- 'attribuer' ou 'rejeter'
  p_numero_client TEXT DEFAULT NULL,
  p_numero_dossier TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_case_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Récupérer le case_id
  SELECT case_id INTO v_case_id
  FROM workflow_attribution_numeros
  WHERE id = p_workflow_id;
  
  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'Demande d''attribution introuvable';
  END IF;
  
  IF p_action = 'attribuer' THEN
    -- Mettre à jour le workflow
    UPDATE workflow_attribution_numeros
    SET 
      statut = 'attribue',
      traite_par = v_user_id,
      date_traitement = now(),
      numero_client_attribue = p_numero_client,
      numero_dossier_attribue = p_numero_dossier,
      notes_secretariat = p_notes,
      updated_at = now()
    WHERE id = p_workflow_id;
    
    -- Mettre à jour le dossier si numéro fourni
    IF p_numero_dossier IS NOT NULL THEN
      UPDATE cases
      SET code_dossier = p_numero_dossier
      WHERE id = v_case_id;
    END IF;
    
  ELSIF p_action = 'rejeter' THEN
    -- Rejeter la demande
    UPDATE workflow_attribution_numeros
    SET 
      statut = 'rejete',
      traite_par = v_user_id,
      date_traitement = now(),
      motif_rejet = p_notes,
      updated_at = now()
    WHERE id = p_workflow_id;
    
  ELSE
    RAISE EXCEPTION 'Action invalide : % (attendu: attribuer ou rejeter)', p_action;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION traiter_attribution_numeros IS 'Traite une demande d''attribution (réservé au Secrétariat)';

-- ========================================
-- 5️⃣ RLS POUR WORKFLOW
-- ========================================

ALTER TABLE workflow_attribution_numeros ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent voir les demandes
DROP POLICY IF EXISTS "Authenticated users can view workflow" ON workflow_attribution_numeros;
CREATE POLICY "Authenticated users can view workflow"
  ON workflow_attribution_numeros FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politique : Tous les utilisateurs peuvent créer des demandes
DROP POLICY IF EXISTS "Users can create workflow requests" ON workflow_attribution_numeros;
CREATE POLICY "Users can create workflow requests"
  ON workflow_attribution_numeros FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Politique : Seul le Secrétariat peut modifier (à implémenter selon vos rôles)
DROP POLICY IF EXISTS "Secretariat can update workflow" ON workflow_attribution_numeros;
CREATE POLICY "Secretariat can update workflow"
  ON workflow_attribution_numeros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.function = 'Secretariat')
    )
  );

-- ========================================
-- 6️⃣ VUES UTILES
-- ========================================

-- Vue : Demandes en attente pour le Secrétariat
CREATE OR REPLACE VIEW v_workflow_en_attente AS
SELECT 
  w.id,
  w.case_id,
  c.title as dossier_titre,
  c.code_dossier,
  cl.name as client_nom,
  cl.client_code,
  p.name as demande_par_nom,
  w.date_demande,
  w.notes_demande,
  w.statut
FROM workflow_attribution_numeros w
JOIN cases c ON c.id = w.case_id
LEFT JOIN clients cl ON cl.id = c.client_id
LEFT JOIN profiles p ON p.id = w.demande_par
WHERE w.statut IN ('en_attente', 'en_traitement')
ORDER BY w.date_demande ASC;

COMMENT ON VIEW v_workflow_en_attente IS 'Demandes d''attribution en attente de traitement par le Secrétariat';

-- Vue : Historique des attributions
CREATE OR REPLACE VIEW v_workflow_historique AS
SELECT 
  w.id,
  w.case_id,
  c.title as dossier_titre,
  c.code_dossier,
  cl.name as client_nom,
  cl.client_code,
  p1.name as demande_par_nom,
  p2.name as traite_par_nom,
  w.date_demande,
  w.date_traitement,
  w.statut,
  w.numero_dossier_attribue,
  w.notes_secretariat,
  w.motif_rejet
FROM workflow_attribution_numeros w
JOIN cases c ON c.id = w.case_id
LEFT JOIN clients cl ON cl.id = c.client_id
LEFT JOIN profiles p1 ON p1.id = w.demande_par
LEFT JOIN profiles p2 ON p2.id = w.traite_par
WHERE w.statut IN ('attribue', 'rejete')
ORDER BY w.date_traitement DESC;

COMMENT ON VIEW v_workflow_historique IS 'Historique des demandes traitées par le Secrétariat';

-- ========================================
-- 7️⃣ TABLE POUR MODÈLES D'ÉTIQUETTES
-- ========================================

-- Table pour stocker les modèles d'étiquettes de chemises
CREATE TABLE IF NOT EXISTS modeles_etiquettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_modele TEXT NOT NULL,
  type_chemise TEXT NOT NULL CHECK (type_chemise IN (
    'dossier_principal',
    'documents_facturation',
    'pieces',
    'ecritures',
    'courriers',
    'observations'
  )),
  
  -- Configuration du template
  largeur_mm NUMERIC DEFAULT 210, -- A4 largeur
  hauteur_mm NUMERIC DEFAULT 297, -- A4 hauteur
  
  -- Champs à afficher
  afficher_date_ouverture BOOLEAN DEFAULT TRUE,
  afficher_numero_client BOOLEAN DEFAULT TRUE,
  afficher_numero_dossier BOOLEAN DEFAULT TRUE,
  afficher_nature_dossier BOOLEAN DEFAULT TRUE,
  afficher_juridiction BOOLEAN DEFAULT TRUE,
  afficher_numero_cabinet BOOLEAN DEFAULT TRUE,
  afficher_parties BOOLEAN DEFAULT TRUE,
  afficher_objet BOOLEAN DEFAULT TRUE,
  
  -- Style
  police TEXT DEFAULT 'Arial',
  taille_police INTEGER DEFAULT 12,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_modeles_type ON modeles_etiquettes(type_chemise);

-- Commentaires
COMMENT ON TABLE modeles_etiquettes IS 'Modèles pour l''impression d''étiquettes de chemises physiques';

-- Insérer un modèle par défaut pour chemise principale
INSERT INTO modeles_etiquettes (
  nom_modele,
  type_chemise,
  afficher_date_ouverture,
  afficher_numero_client,
  afficher_numero_dossier,
  afficher_nature_dossier,
  afficher_juridiction,
  afficher_numero_cabinet,
  afficher_parties,
  afficher_objet
)
VALUES (
  'Modèle standard - Chemise principale',
  'dossier_principal',
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- ========================================
-- 8️⃣ FONCTION GÉNÉRATION DONNÉES ÉTIQUETTE
-- ========================================

-- Fonction pour générer les données d'une étiquette
CREATE OR REPLACE FUNCTION generer_donnees_etiquette(p_case_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'date_ouverture', to_char(c.created_at, 'DD/MM/YYYY'),
    'numero_client', cl.client_code,
    'numero_dossier', c.code_dossier,
    'nature_dossier', c.case_type,
    'type_diligence', c.type_de_diligence,
    'juridiction', COALESCE(
      (SELECT di.juridiction_competente 
       FROM dossier_instance di 
       WHERE di.case_id = c.id 
       ORDER BY di.created_at DESC 
       LIMIT 1),
      'Non définie'
    ),
    'numero_cabinet_instruction', COALESCE(c.numero_cabinet_instruction, 'N/A'),
    'parties', json_build_object(
      'client', cl.name,
      'adverse', COALESCE(c.opposing_party, 'Non définie')
    ),
    'objet_dossier', COALESCE(c.objet_du_dossier, c.title),
    'titre_dossier', c.title
  ) INTO v_result
  FROM cases c
  LEFT JOIN clients cl ON cl.id = c.client_id
  WHERE c.id = p_case_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generer_donnees_etiquette IS 'Génère les données pour l''impression d''une étiquette de chemise';

-- ========================================
-- 9️⃣ TESTS
-- ========================================

DO $$
DECLARE
  test_case_id UUID;
  test_workflow_id UUID;
  test_etiquette JSON;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 TESTS - PRIORITÉ 2';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  -- Test 1 : Numéro cabinet d'instruction
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ TEST NUMÉRO CABINET INSTRUCTION';
  SELECT id INTO test_case_id FROM cases LIMIT 1;
  
  IF test_case_id IS NOT NULL THEN
    UPDATE cases 
    SET numero_cabinet_instruction = 'CAB-2025-001'
    WHERE id = test_case_id;
    
    RAISE NOTICE '   ✅ Champ numero_cabinet_instruction ajouté et testé';
  ELSE
    RAISE NOTICE '   ⚠️ Aucun dossier pour tester';
  END IF;
  
  -- Test 2 : Workflow attribution
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ TEST WORKFLOW SECRÉTARIAT';
  IF test_case_id IS NOT NULL THEN
    -- Simuler une demande
    SELECT demander_attribution_numeros(test_case_id, 'Demande test') INTO test_workflow_id;
    RAISE NOTICE '   ✅ Demande d''attribution créée : %', test_workflow_id;
    
    -- Nettoyer
    DELETE FROM workflow_attribution_numeros WHERE id = test_workflow_id;
  END IF;
  
  -- Test 3 : Génération étiquette
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ TEST GÉNÉRATION ÉTIQUETTE';
  IF test_case_id IS NOT NULL THEN
    SELECT generer_donnees_etiquette(test_case_id) INTO test_etiquette;
    RAISE NOTICE '   ✅ Données étiquette générées';
    RAISE NOTICE '   📄 %', test_etiquette::TEXT;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ========================================
-- 🔟 RÉSUMÉ
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRIORITÉ 2 TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 FONCTIONNALITÉS AJOUTÉES :';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ NUMÉRO CABINET INSTRUCTION';
  RAISE NOTICE '   • Champ numero_cabinet_instruction dans cases';
  RAISE NOTICE '   • Champ numero_cabinet_instruction dans dossier_instance';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ WORKFLOW SECRÉTARIAT';
  RAISE NOTICE '   • Table workflow_attribution_numeros';
  RAISE NOTICE '   • Fonction demander_attribution_numeros()';
  RAISE NOTICE '   • Fonction traiter_attribution_numeros()';
  RAISE NOTICE '   • Vues v_workflow_en_attente et v_workflow_historique';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ ÉTIQUETTES CHEMISES';
  RAISE NOTICE '   • Table modeles_etiquettes';
  RAISE NOTICE '   • Fonction generer_donnees_etiquette()';
  RAISE NOTICE '   • Modèle standard créé';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PROCHAINE ÉTAPE :';
  RAISE NOTICE '   Créer les composants React pour utiliser ces fonctionnalités';
  RAISE NOTICE '';
END $$;

-- Afficher les nouvelles colonnes
SELECT 
  'cases' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'cases'
  AND column_name IN ('numero_cabinet_instruction')
UNION ALL
SELECT 
  'dossier_instance' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'dossier_instance'
  AND column_name IN ('numero_cabinet_instruction')
ORDER BY table_name, column_name;
