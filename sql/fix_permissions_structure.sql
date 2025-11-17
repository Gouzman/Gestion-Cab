-- Script de diagnostic et correction des tables de permissions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle des tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'profiles', 'user_permissions', 'app_metadata')
ORDER BY table_name, ordinal_position;

-- 2. Créer la table users si elle n'existe pas (avec les bonnes colonnes)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user', -- 'admin', 'gerant', 'avocat', 'secretaire', etc.
    function TEXT, -- 'Gerant', 'Associe Emerite', etc.
    isFirstLogin BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Créer la table user_permissions si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 4. Créer la table profiles si elle n'existe pas (pour compatibilité)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    function TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Créer la table app_metadata pour les paramètres généraux
CREATE TABLE IF NOT EXISTS app_metadata (
    id INTEGER PRIMARY KEY DEFAULT 1,
    task_categories JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Insérer des données de test si les tables sont vides
INSERT INTO users (email, name, role, function, isFirstLogin) VALUES
('admin@gestion-cabinet.com', 'Administrateur', 'admin', 'Gerant', false),
('avocat1@cabinet.com', 'Marie Dupont', 'avocat', 'Avocat', true),
('secretaire@cabinet.com', 'Pierre Martin', 'secretaire', 'Secretaire', true)
ON CONFLICT (email) DO NOTHING;

-- 7. Synchroniser la table profiles avec users (pour compatibilité)
INSERT INTO profiles (id, name, email, function, role)
SELECT id, name, email, function, role FROM users
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    function = EXCLUDED.function,
    role = EXCLUDED.role;

-- 8. Ajouter des permissions par défaut pour les utilisateurs
INSERT INTO user_permissions (user_id, permissions)
SELECT id, '{
    "dashboard": {"visible": true, "actions": {}},
    "tasks": {"visible": true, "actions": {"create": true, "edit": true, "delete": false, "reassign": false}},
    "clients": {"visible": true, "actions": {"create": true, "edit": true, "delete": false}},
    "cases": {"visible": true, "actions": {"create": true, "edit": true, "delete": false}},
    "calendar": {"visible": true, "actions": {"create": true, "edit": true, "delete": false}},
    "documents": {"visible": true, "actions": {"upload": true, "delete": false}},
    "billing": {"visible": false, "actions": {"create": false, "edit": false, "delete": false}},
    "team": {"visible": false, "actions": {"create": false, "edit": false, "delete": false}},
    "reports": {"visible": true, "actions": {}},
    "settings": {"visible": false, "actions": {}}
}'::jsonb FROM users WHERE role != 'admin' AND role != 'gerant'
ON CONFLICT (user_id) DO NOTHING;

-- 9. Permissions complètes pour les gérants/admins
INSERT INTO user_permissions (user_id, permissions)
SELECT id, '{
    "dashboard": {"visible": true, "actions": {}},
    "tasks": {"visible": true, "actions": {"create": true, "edit": true, "delete": true, "reassign": true}},
    "clients": {"visible": true, "actions": {"create": true, "edit": true, "delete": true}},
    "cases": {"visible": true, "actions": {"create": true, "edit": true, "delete": true}},
    "calendar": {"visible": true, "actions": {"create": true, "edit": true, "delete": true}},
    "documents": {"visible": true, "actions": {"upload": true, "delete": true}},
    "billing": {"visible": true, "actions": {"create": true, "edit": true, "delete": true}},
    "team": {"visible": true, "actions": {"create": true, "edit": true, "delete": true}},
    "reports": {"visible": true, "actions": {}},
    "settings": {"visible": true, "actions": {}}
}'::jsonb FROM users WHERE role = 'admin' OR function = 'Gerant'
ON CONFLICT (user_id) DO NOTHING;

-- 10. Ajouter des catégories de tâches par défaut
INSERT INTO app_metadata (id, task_categories) VALUES (1, '[
    {"value": "consultation", "label": "Consultation"},
    {"value": "plaidoirie", "label": "Plaidoirie"},
    {"value": "redaction", "label": "Rédaction"},
    {"value": "recherche", "label": "Recherche juridique"},
    {"value": "negociation", "label": "Négociation"},
    {"value": "administratif", "label": "Tâches administratives"}
]'::jsonb) ON CONFLICT (id) DO NOTHING;

-- 11. Activer RLS (Row Level Security) pour la sécurité
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 12. Politiques de sécurité basiques (à ajuster selon vos besoins)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND (role = 'admin' OR function = 'Gerant')
        )
    );

CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND (role = 'admin' OR function = 'Gerant')
        )
    );

-- 13. Afficher le résultat final
SELECT 
    u.email,
    u.name,
    u.role,
    u.function,
    u.isFirstLogin,
    CASE WHEN up.permissions IS NOT NULL THEN 'Oui' ELSE 'Non' END as has_permissions
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
ORDER BY u.role, u.name;