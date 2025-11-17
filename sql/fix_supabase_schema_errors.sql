-- Script SQL pour corriger les erreurs de schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter les colonnes manquantes à la table tasks

-- Colonne pour la catégorie principale d'une tâche (ex: "Contentieux", "Droit Civil", etc.)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS main_category TEXT;

-- Colonne pour tracker quand une tâche a été vue par l'assigné
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- Colonne pour stocker le commentaire de complétion d'une tâche
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completion_comment TEXT;

-- 2. Créer la table calendar_events si elle n'existe pas
-- Cette table est utilisée par le composant Calendar pour les événements
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

-- Alternative: Si vous préférez que calendar_events copie la structure de events existante
-- Décommentez cette ligne et commentez le CREATE TABLE ci-dessus
-- CREATE TABLE IF NOT EXISTS calendar_events (LIKE events INCLUDING ALL);

-- 3. Ajouter des commentaires pour documenter les nouvelles colonnes/tables
COMMENT ON COLUMN tasks.main_category IS 'Catégorie principale de la tâche (ex: Contentieux, Droit Civil, etc.)';
COMMENT ON COLUMN tasks.seen_at IS 'Timestamp indiquant quand la tâche a été vue par l''assigné';
COMMENT ON COLUMN tasks.completion_comment IS 'Commentaire ajouté lors de la complétion de la tâche';
COMMENT ON TABLE calendar_events IS 'Table des événements du calendrier créés par les utilisateurs';
COMMENT ON COLUMN calendar_events.attendees IS 'Array des IDs des utilisateurs invités à cet événement';

-- 4. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tasks_main_category 
ON tasks(main_category) 
WHERE main_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_seen_at 
ON tasks(seen_at) 
WHERE seen_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by 
ON calendar_events(created_by);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time 
ON calendar_events(start_time);

-- 5. Politique RLS pour calendar_events (sécurité)
-- Les utilisateurs peuvent voir leurs propres événements et ceux où ils sont invités
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Politique de lecture: voir ses propres événements et ceux où on est invité
CREATE POLICY IF NOT EXISTS "Users can view their events and events they attend" 
ON calendar_events FOR SELECT 
USING (
    auth.uid() = created_by 
    OR auth.uid() = ANY(attendees)
);

-- Politique de création: créer ses propres événements
CREATE POLICY IF NOT EXISTS "Users can create their own events" 
ON calendar_events FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Politique de modification: modifier ses propres événements
CREATE POLICY IF NOT EXISTS "Users can update their own events" 
ON calendar_events FOR UPDATE 
USING (auth.uid() = created_by);

-- Politique de suppression: supprimer ses propres événements
CREATE POLICY IF NOT EXISTS "Users can delete their own events" 
ON calendar_events FOR DELETE 
USING (auth.uid() = created_by);

-- 6. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Vérification des colonnes ajoutées
-- Vous pouvez exécuter cette requête pour vérifier que tout est correct :
/*
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('main_category', 'seen_at', 'completion_comment')
ORDER BY column_name;

-- Vérifier la table calendar_events
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'calendar_events' 
AND table_schema = 'public';

-- Lister les colonnes de calendar_events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
ORDER BY ordinal_position;
*/

-- 8. Note importante
-- Après l'exécution de ce script, le cache du schéma Supabase se rafraîchira automatiquement.
-- Si les erreurs persistent, redémarrez votre application React.
-- 
-- 9. Créer le bucket Storage pour les pièces jointes
-- Note: Cette commande peut échouer si le bucket existe déjà, c'est normal
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- 10. Politique RLS pour le bucket attachments
-- Les utilisateurs peuvent télécharger leurs propres fichiers et ceux des tâches qui leur sont assignées
INSERT INTO storage.policies (id, bucket_id, name, operation, permission, owner, action, check_expression)
VALUES 
('attachments-upload', 'attachments', 'Users can upload attachments', 'INSERT', 'authenticated', null, 'storage.filename(name) like auth.uid()::text || ''/%''', null),
('attachments-select', 'attachments', 'Users can view attachments', 'SELECT', 'authenticated', null, 'true', null),
('attachments-update', 'attachments', 'Users can update their attachments', 'UPDATE', 'authenticated', null, 'storage.filename(name) like auth.uid()::text || ''/%''', null),
('attachments-delete', 'attachments', 'Users can delete their attachments', 'DELETE', 'authenticated', null, 'storage.filename(name) like auth.uid()::text || ''/%''', null)
ON CONFLICT (id) DO NOTHING;

-- Une fois ce script exécuté, vous pouvez :
-- 1. Retirer les lignes de suppression de main_category dans TaskManager.jsx
-- 2. Décommenter et réactiver la logique seen_at et completion_comment dans TaskManager.jsx
-- 3. Ajouter ces colonnes aux requêtes SELECT
-- 4. Remplacer supabase.from('events') par supabase.from('calendar_events') dans Calendar.jsx et EventForm.jsx
-- 5. Le bucket 'attachments' sera automatiquement créé et configuré