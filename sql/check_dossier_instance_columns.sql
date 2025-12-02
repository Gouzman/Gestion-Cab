-- Vérifier les colonnes existantes de la table dossier_instance
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dossier_instance'
ORDER BY ordinal_position;
