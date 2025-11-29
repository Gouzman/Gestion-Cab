-- ⚠️ FIX TEMPORAIRE: Rendre client_code NULLABLE
-- 
-- Contexte: La colonne client_code a été créée avec NOT NULL mais le trigger
-- de génération automatique n'existe pas encore (migration complète non exécutée).
-- 
-- Cette correction permet de créer des clients sans erreur en attendant
-- la migration complète (migration_conformite_juridique.sql)

-- 1. Retirer la contrainte NOT NULL sur client_code
ALTER TABLE clients 
ALTER COLUMN client_code DROP NOT NULL;

-- 2. Vérification
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'client_code';

-- ✅ Après cette correction:
-- - client_code peut être NULL temporairement
-- - Les clients existants gardent leur code
-- - Nouveaux clients peuvent être créés sans erreur
-- 
-- 🔜 Prochaine étape:
-- Exécuter sql/migration_conformite_juridique.sql qui:
-- - Crée le trigger de génération automatique
-- - Génère les codes pour les clients sans code
-- - Remet la contrainte NOT NULL avec protection
