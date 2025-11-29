-- Migration: Ajouter la colonne invoice_type à la table invoices
-- Date: 2025-11-29
-- Description: Ajout du type de facture (proforma ou definitive)

-- Ajouter la colonne invoice_type avec valeur par défaut 'definitive'
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'definitive';

-- Ajouter une contrainte pour valider les valeurs possibles
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_type 
CHECK (invoice_type IN ('proforma', 'definitive'));

-- Créer un index pour améliorer les performances des requêtes filtrées par type
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN invoices.invoice_type IS 'Type de facture: proforma (facture pro forma) ou definitive (facture définitive)';

-- Mettre à jour les factures existantes qui pourraient avoir NULL
UPDATE invoices 
SET invoice_type = 'definitive' 
WHERE invoice_type IS NULL;
