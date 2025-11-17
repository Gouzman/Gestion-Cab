-- ============================================
-- TABLE app_settings
-- Gestion centralisée des paramètres d'application
-- ============================================
-- Cette table stocke TOUTES les configurations de l'application
-- dans un format JSON flexible, permettant d'ajouter facilement
-- de nouveaux paramètres sans modifier la structure de la table.
-- ============================================

-- Créer la table app_settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Configuration de l'entreprise
  company_info JSONB DEFAULT '{
    "name": "Cabinet d''Avocats",
    "logo_url": "",
    "address": "",
    "phone": "",
    "email": "",
    "slogan": "",
    "description": ""
  }'::jsonb,
  
  -- Configuration du menu (activation/désactivation des sections)
  menu_config JSONB DEFAULT '{
    "items": [
      {"id": "dashboard", "label": "Tableau de bord", "enabled": true, "order": 1},
      {"id": "clients", "label": "Clients", "enabled": true, "order": 2},
      {"id": "cases", "label": "Dossiers", "enabled": true, "order": 3},
      {"id": "tasks", "label": "Tâches", "enabled": true, "order": 4},
      {"id": "documents", "label": "Documents", "enabled": true, "order": 5},
      {"id": "calendar", "label": "Calendrier", "enabled": true, "order": 6},
      {"id": "team", "label": "Collaborateurs", "enabled": true, "order": 7},
      {"id": "billing", "label": "Facturation", "enabled": true, "order": 8},
      {"id": "settings", "label": "Paramètres", "enabled": true, "order": 9}
    ]
  }'::jsonb,
  
  -- Catégories et types configurables
  categories_config JSONB DEFAULT '{
    "task_categories": [],
    "case_types": [],
    "user_roles": [
      {"value": "admin", "label": "Administrateur"},
      {"value": "gerant", "label": "Gérant"},
      {"value": "avocat", "label": "Avocat"},
      {"value": "secretaire", "label": "Secrétaire"}
    ],
    "task_statuses": [
      {"value": "todo", "label": "À faire", "color": "gray"},
      {"value": "in_progress", "label": "En cours", "color": "blue"},
      {"value": "done", "label": "Terminé", "color": "green"}
    ],
    "case_statuses": [
      {"value": "open", "label": "Ouvert", "color": "green"},
      {"value": "in_progress", "label": "En cours", "color": "blue"},
      {"value": "closed", "label": "Fermé", "color": "gray"}
    ]
  }'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : une seule ligne dans la table
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insérer la configuration par défaut si la table est vide
INSERT INTO app_settings (id) 
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Créer un index sur les champs JSON fréquemment consultés
CREATE INDEX IF NOT EXISTS idx_app_settings_company_name 
ON app_settings ((company_info->>'name'));

-- Policy RLS : Lecture pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "allow_read_app_settings" ON app_settings;
CREATE POLICY "allow_read_app_settings" ON app_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy RLS : Modification uniquement pour les admins/gérants
DROP POLICY IF EXISTS "allow_update_app_settings" ON app_settings;
CREATE POLICY "allow_update_app_settings" ON app_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'gerant')
    )
  );

-- Activer RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_timestamp();

-- Vérification : afficher la configuration par défaut
SELECT 
  id,
  company_info->>'name' as company_name,
  jsonb_array_length(menu_config->'items') as menu_items_count,
  created_at
FROM app_settings;
