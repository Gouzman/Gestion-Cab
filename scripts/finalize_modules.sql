-- ========================================
-- SCRIPT DE FINALISATION DES MODULES
-- Exécuter dans Supabase SQL Editor
-- ========================================

-- 📌 1. CRÉATION DES BUCKETS STORAGE
-- Note: Les buckets doivent être créés manuellement dans le Dashboard Supabase
-- ou via l'API Supabase. SQL ne peut pas créer de buckets.
-- Instructions :
-- 1. Aller dans Storage > Create bucket
-- 2. Créer "attachments" avec : Public = false, Allowed MIME types = tous
-- 3. Créer "task-scans" avec : Public = false, Allowed MIME types = tous

-- 📌 2. TABLE TASKS - Ajout des colonnes manquantes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_comment TEXT;

-- 📌 3. TABLE CASES - Ajout des colonnes manquantes
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS honoraire BIGINT DEFAULT 0;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS expected_end_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_party TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS visible_to UUID[];

-- 📌 4. TABLE CALENDAR_EVENTS - Création
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attendees UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own events and events they attend" ON calendar_events;
DROP POLICY IF EXISTS "Users can create events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;

-- Politique : Les utilisateurs peuvent voir leurs propres événements et ceux où ils sont participants
CREATE POLICY "Users can view their own events and events they attend"
  ON calendar_events FOR SELECT
  USING (
    created_by = auth.uid() OR 
    auth.uid() = ANY(attendees) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent créer des événements
CREATE POLICY "Users can create events"
  ON calendar_events FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Politique : Les utilisateurs peuvent modifier leurs propres événements
CREATE POLICY "Users can update their own events"
  ON calendar_events FOR UPDATE
  USING (created_by = auth.uid());

-- Politique : Les utilisateurs peuvent supprimer leurs propres événements
CREATE POLICY "Users can delete their own events"
  ON calendar_events FOR DELETE
  USING (created_by = auth.uid());

-- 📌 5. TABLE APP_SETTINGS - Création
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_info JSONB DEFAULT '{}'::jsonb,
  menu_config JSONB DEFAULT '{}'::jsonb,
  categories_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insérer la ligne unique si elle n'existe pas
INSERT INTO app_settings (id, company_info, menu_config, categories_config)
VALUES (
  1,
  '{
    "name": "",
    "address": "",
    "phone": "",
    "email": "",
    "website": "",
    "logo": null
  }'::jsonb,
  '{
    "visible_modules": ["dashboard", "tasks", "cases", "calendar", "clients", "invoices", "reports", "settings"]
  }'::jsonb,
  '{
    "document_types": ["Contrat", "Procès-verbal", "Requête", "Mémoire", "Ordonnance", "Jugement", "Autre"],
    "auto_logout_timeout": 30
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- RLS pour app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Everyone can read app settings" ON app_settings;
DROP POLICY IF EXISTS "Only admins can update app settings" ON app_settings;

-- Politique : Tout le monde peut lire les paramètres
CREATE POLICY "Everyone can read app settings"
  ON app_settings FOR SELECT
  USING (true);

-- Politique : Seuls les admins peuvent modifier les paramètres
CREATE POLICY "Only admins can update app settings"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 📌 6. VÉRIFICATION DES FONCTIONS RPC COLLABORATEURS
-- Vérifier l'existence des fonctions
DO $$
BEGIN
  -- Vérifier create_collaborator
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'create_collaborator'
    AND routine_type = 'FUNCTION'
  ) THEN
    RAISE NOTICE '⚠️ Fonction create_collaborator manquante - À créer manuellement';
  ELSE
    RAISE NOTICE '✅ Fonction create_collaborator existe';
  END IF;

  -- Vérifier delete_user_account
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'delete_user_account'
    AND routine_type = 'FUNCTION'
  ) THEN
    RAISE NOTICE '⚠️ Fonction delete_user_account manquante - À créer manuellement';
  ELSE
    RAISE NOTICE '✅ Fonction delete_user_account existe';
  END IF;
END $$;

-- 📌 7. INDEX POUR PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Fin du script
SELECT '✅ Script de finalisation terminé' as status;
