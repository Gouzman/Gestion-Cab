-- ========================================
-- PRIORITY 3 : CLIENTS CONVENTIONNÉS (Article 81)
-- Certains clients bénéficient d'un traitement spécifique
-- Flux particulier pour le secrétariat
-- ========================================

-- 1️⃣ Ajouter les colonnes pour les clients conventionnés
DO $$
BEGIN
  -- Marqueur client conventionné
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'is_conventionne'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_conventionne BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_conventionne ajoutée';
  END IF;
  
  -- Numéro de convention
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'numero_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN numero_convention TEXT;
    RAISE NOTICE '✅ Colonne numero_convention ajoutée';
  END IF;
  
  -- Date de début de convention
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'date_debut_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN date_debut_convention DATE;
    RAISE NOTICE '✅ Colonne date_debut_convention ajoutée';
  END IF;
  
  -- Date de fin de convention
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'date_fin_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN date_fin_convention DATE;
    RAISE NOTICE '✅ Colonne date_fin_convention ajoutée';
  END IF;
  
  -- Type de convention
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'type_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN type_convention TEXT CHECK (type_convention IN (
      'aide_juridictionnelle',
      'assurance_protection_juridique',
      'convention_entreprise',
      'autre'
    ));
    RAISE NOTICE '✅ Colonne type_convention ajoutée';
  END IF;
  
  -- Organisme conventionné (ex: nom de l'assurance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'organisme_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN organisme_convention TEXT;
    RAISE NOTICE '✅ Colonne organisme_convention ajoutée';
  END IF;
  
  -- Taux de prise en charge (en pourcentage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'taux_prise_en_charge'
  ) THEN
    ALTER TABLE clients ADD COLUMN taux_prise_en_charge NUMERIC(5,2) CHECK (taux_prise_en_charge >= 0 AND taux_prise_en_charge <= 100);
    RAISE NOTICE '✅ Colonne taux_prise_en_charge ajoutée';
  END IF;
  
  -- Notes spécifiques à la convention
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'notes_convention'
  ) THEN
    ALTER TABLE clients ADD COLUMN notes_convention TEXT;
    RAISE NOTICE '✅ Colonne notes_convention ajoutée';
  END IF;
END $$;

-- 2️⃣ Ajouter une contrainte de cohérence
-- Si is_conventionne = true, alors numero_convention et type_convention sont obligatoires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_convention_coherence'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT check_convention_coherence 
      CHECK (
        (is_conventionne = false) OR 
        (is_conventionne = true AND numero_convention IS NOT NULL AND type_convention IS NOT NULL)
      );
    RAISE NOTICE '✅ Contrainte check_convention_coherence ajoutée';
  END IF;
END $$;

-- 3️⃣ Index pour les performances
CREATE INDEX IF NOT EXISTS idx_clients_conventionne ON clients(is_conventionne) WHERE is_conventionne = true;
CREATE INDEX IF NOT EXISTS idx_clients_type_convention ON clients(type_convention) WHERE type_convention IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_date_fin_convention ON clients(date_fin_convention) WHERE date_fin_convention IS NOT NULL;

-- 4️⃣ Commentaires
COMMENT ON COLUMN clients.is_conventionne IS 'true si le client bénéficie d''une convention (aide juridictionnelle, assurance, etc.)';
COMMENT ON COLUMN clients.numero_convention IS 'Numéro de référence de la convention';
COMMENT ON COLUMN clients.date_debut_convention IS 'Date de début de la convention';
COMMENT ON COLUMN clients.date_fin_convention IS 'Date de fin de la convention';
COMMENT ON COLUMN clients.type_convention IS 'Type de convention : aide juridictionnelle, assurance, convention entreprise, autre';
COMMENT ON COLUMN clients.organisme_convention IS 'Nom de l''organisme (ex: nom de l''assurance, CPAM, etc.)';
COMMENT ON COLUMN clients.taux_prise_en_charge IS 'Taux de prise en charge en pourcentage (0-100)';
COMMENT ON COLUMN clients.notes_convention IS 'Notes spécifiques concernant la convention';

-- 5️⃣ Vue pour les clients conventionnés actifs
CREATE OR REPLACE VIEW v_clients_conventionnes_actifs AS
SELECT 
  c.id,
  c.client_code,
  c.name,
  c.type,
  c.is_conventionne,
  c.numero_convention,
  c.type_convention,
  c.organisme_convention,
  c.taux_prise_en_charge,
  c.date_debut_convention,
  c.date_fin_convention,
  CASE 
    WHEN c.date_fin_convention IS NULL THEN true
    WHEN c.date_fin_convention >= CURRENT_DATE THEN true
    ELSE false
  END as convention_active,
  c.notes_convention,
  c.email,
  c.phone,
  c.created_at
FROM clients c
WHERE c.is_conventionne = true
ORDER BY c.name;

COMMENT ON VIEW v_clients_conventionnes_actifs IS 'Liste des clients conventionnés avec leur statut actif/expiré';

-- 6️⃣ Vue pour les conventions arrivant à expiration (30 jours)
CREATE OR REPLACE VIEW v_conventions_expirant_bientot AS
SELECT 
  c.id,
  c.client_code,
  c.name,
  c.numero_convention,
  c.type_convention,
  c.organisme_convention,
  c.date_fin_convention,
  c.date_fin_convention - CURRENT_DATE as jours_restants,
  c.email,
  c.phone
FROM clients c
WHERE 
  c.is_conventionne = true 
  AND c.date_fin_convention IS NOT NULL
  AND c.date_fin_convention BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY c.date_fin_convention ASC;

COMMENT ON VIEW v_conventions_expirant_bientot IS 'Conventions arrivant à expiration dans les 30 prochains jours';

-- 7️⃣ Fonction pour vérifier si une convention est active
CREATE OR REPLACE FUNCTION is_convention_active(p_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  SELECT 
    CASE 
      WHEN is_conventionne = false THEN false
      WHEN date_fin_convention IS NULL THEN true
      WHEN date_fin_convention >= CURRENT_DATE THEN true
      ELSE false
    END INTO v_result
  FROM clients
  WHERE id = p_client_id;
  
  RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_convention_active IS 'Vérifie si la convention d''un client est active';

-- 8️⃣ Fonction pour obtenir les statistiques des conventions
CREATE OR REPLACE FUNCTION get_conventions_stats()
RETURNS TABLE (
  total_conventionnes BIGINT,
  conventions_actives BIGINT,
  conventions_expirees BIGINT,
  expirant_bientot BIGINT,
  par_type_aide_juridictionnelle BIGINT,
  par_type_assurance BIGINT,
  par_type_convention_entreprise BIGINT,
  par_type_autre BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE is_conventionne = true),
    COUNT(*) FILTER (WHERE is_conventionne = true AND (date_fin_convention IS NULL OR date_fin_convention >= CURRENT_DATE)),
    COUNT(*) FILTER (WHERE is_conventionne = true AND date_fin_convention < CURRENT_DATE),
    COUNT(*) FILTER (WHERE is_conventionne = true AND date_fin_convention BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')),
    COUNT(*) FILTER (WHERE type_convention = 'aide_juridictionnelle'),
    COUNT(*) FILTER (WHERE type_convention = 'assurance_protection_juridique'),
    COUNT(*) FILTER (WHERE type_convention = 'convention_entreprise'),
    COUNT(*) FILTER (WHERE type_convention = 'autre')
  FROM clients;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_conventions_stats IS 'Retourne les statistiques des clients conventionnés';

-- 9️⃣ Trigger pour alerter sur l'expiration (DÉSACTIVÉ - optionnel)
-- Note: Peut être activé ultérieurement avec une notification système
-- Pour l'instant, les alertes sont gérées via le ConventionDashboard

-- CREATE OR REPLACE FUNCTION check_convention_expiration()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Fonction désactivée pour éviter les conflits avec activities
--   -- Les alertes d'expiration sont affichées dans le ConventionDashboard
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trigger_check_convention_expiration ON clients;

-- 🔟 Résumé
DO $$
DECLARE
  v_total BIGINT;
  v_actifs BIGINT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE is_conventionne = true),
    COUNT(*) FILTER (WHERE is_conventionne = true AND (date_fin_convention IS NULL OR date_fin_convention >= CURRENT_DATE))
  INTO v_total, v_actifs
  FROM clients;
  
  RAISE NOTICE '✅ Système de clients conventionnés activé';
  RAISE NOTICE '   - Total conventionnés: %', v_total;
  RAISE NOTICE '   - Conventions actives: %', v_actifs;
  RAISE NOTICE '   - Vues créées: v_clients_conventionnes_actifs, v_conventions_expirant_bientot';
  RAISE NOTICE '   - Fonctions: is_convention_active(), get_conventions_stats()';
END $$;

SELECT 
  '✅ Système de clients conventionnés activé' as status,
  COUNT(*) FILTER (WHERE is_conventionne = true) as total_conventionnes,
  COUNT(*) FILTER (WHERE is_conventionne = true AND (date_fin_convention IS NULL OR date_fin_convention >= CURRENT_DATE)) as conventions_actives
FROM clients;
