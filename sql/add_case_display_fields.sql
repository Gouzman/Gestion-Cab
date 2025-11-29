-- Migration : Ajouter les champs d'affichage pour les dossiers
-- Date : 28 novembre 2025
-- Description : Ajout des colonnes code_dossier, ref_dossier, case_type, assigned_to, next_hearing et client_type

-- 1. Ajouter la colonne code_dossier (ID du dossier)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS code_dossier TEXT;

-- 2. Ajouter la colonne ref_dossier (Référence dossier)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS ref_dossier TEXT;

-- 3. Ajouter la colonne case_type (Type de dossier)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS case_type TEXT;

-- 4. Ajouter la colonne client_type (Type de client)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'particulier';

-- 5. Ajouter la colonne assigned_to (Assigné à)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- 6. Ajouter la colonne next_hearing (Prochaine audience)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS next_hearing DATE;

-- 7. Ajouter un index sur code_dossier pour les recherches
CREATE INDEX IF NOT EXISTS idx_cases_code_dossier ON cases(code_dossier);

-- 8. Ajouter un index sur ref_dossier pour les recherches
CREATE INDEX IF NOT EXISTS idx_cases_ref_dossier ON cases(ref_dossier);

-- 9. Ajouter un index sur case_type pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);

-- 10. Ajouter un index sur client_type pour les filtrages
CREATE INDEX IF NOT EXISTS idx_cases_client_type ON cases(client_type);

-- 11. Ajouter un index sur assigned_to pour les filtrages
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);

-- 12. Ajouter un index sur next_hearing pour les tri par date
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON cases(next_hearing);

-- 13. Commentaires sur les colonnes
COMMENT ON COLUMN cases.code_dossier IS 'ID du dossier (saisi manuellement)';
COMMENT ON COLUMN cases.ref_dossier IS 'Référence du dossier (saisie manuellement)';
COMMENT ON COLUMN cases.case_type IS 'Type de dossier (ex: Litige contractuel, Droit Civil, etc.)';
COMMENT ON COLUMN cases.client_type IS 'Type de client (particulier ou entreprise)';
COMMENT ON COLUMN cases.assigned_to IS 'Nom du collaborateur assigné au dossier';
COMMENT ON COLUMN cases.next_hearing IS 'Date de la prochaine audience';

-- Note : Les valeurs par défaut sont NULL pour permettre la migration en douceur
-- Les dossiers existants pourront être mis à jour progressivement via l'interface
