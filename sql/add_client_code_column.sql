-- Ajouter la colonne client_code à la table clients
-- Cette colonne servira d'identifiant métier visible par l'utilisateur
-- tandis que id (uuid) reste la clé primaire technique

-- 1. Ajouter la colonne client_code
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS client_code TEXT;

-- 2. Générer des codes clients pour les clients existants s'ils n'en ont pas
-- Format: CLI-XXX pour les particuliers, ENT-XXX pour les entreprises
DO $$
DECLARE
  client_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR client_record IN 
    SELECT id, type FROM clients WHERE client_code IS NULL
  LOOP
    IF client_record.type = 'company' OR client_record.type = 'entreprise' THEN
      UPDATE clients 
      SET client_code = 'ENT-' || LPAD(counter::TEXT, 3, '0')
      WHERE id = client_record.id;
    ELSE
      UPDATE clients 
      SET client_code = 'CLI-' || LPAD(counter::TEXT, 3, '0')
      WHERE id = client_record.id;
    END IF;
    counter := counter + 1;
  END LOOP;
END $$;

-- 3. Rendre la colonne obligatoire et unique
ALTER TABLE clients 
ALTER COLUMN client_code SET NOT NULL;

ALTER TABLE clients 
ADD CONSTRAINT clients_client_code_unique UNIQUE (client_code);

-- 4. Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);

-- 5. Commentaire pour documentation
COMMENT ON COLUMN clients.client_code IS 'Identifiant métier unique du client (ex: CLI-001, ENT-042)';
