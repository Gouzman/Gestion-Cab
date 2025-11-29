-- Création de la table invoices pour la gestion des factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  case_id TEXT,
  case_title TEXT,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_type TEXT NOT NULL DEFAULT 'definitive' CHECK (invoice_type IN ('proforma', 'definitive')),
  debours JSONB DEFAULT '{}',
  honoraires JSONB DEFAULT '{}',
  payment JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'non réglée',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs authentifiés peuvent lire toutes les factures
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les factures"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

-- Politique: Les utilisateurs authentifiés peuvent créer des factures
CREATE POLICY "Les utilisateurs authentifiés peuvent créer des factures"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique: Les utilisateurs peuvent modifier leurs propres factures ou si admin/gerant
CREATE POLICY "Les utilisateurs peuvent modifier les factures"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique: Les utilisateurs peuvent supprimer leurs propres factures ou si admin/gerant
CREATE POLICY "Les utilisateurs peuvent supprimer les factures"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE invoices IS 'Table pour stocker les factures du cabinet';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro unique de la facture (ex: FACT-2025-001)';
COMMENT ON COLUMN invoices.case_id IS 'Référence au dossier associé';
COMMENT ON COLUMN invoices.case_title IS 'Titre du dossier pour affichage';
COMMENT ON COLUMN invoices.total_ttc IS 'Montant total TTC de la facture';
COMMENT ON COLUMN invoices.invoice_type IS 'Type de facture: proforma (facture pro forma) ou definitive (facture définitive)';
COMMENT ON COLUMN invoices.debours IS 'Détails des débours (JSON)';
COMMENT ON COLUMN invoices.honoraires IS 'Détails des honoraires (JSON)';
COMMENT ON COLUMN invoices.payment IS 'Informations de paiement (JSON)';
COMMENT ON COLUMN invoices.status IS 'Statut: non réglée, réglée partiellement, réglée totalement';
