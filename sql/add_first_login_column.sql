-- Script SQL pour ajouter la gestion de première connexion
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne isFirstLogin à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS isFirstLogin BOOLEAN DEFAULT true;

-- 2. Mettre à jour tous les utilisateurs existants pour qu'ils ne soient pas en première connexion
-- (sauf si vous voulez qu'ils redéfinissent leur mot de passe)
UPDATE users 
SET isFirstLogin = false 
WHERE isFirstLogin IS NULL;

-- 3. Ajouter un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_first_login 
ON users(isFirstLogin) 
WHERE isFirstLogin = true;

-- 4. Commentaires sur la structure attendue de la table users
-- La table users doit contenir au minimum :
-- - id (UUID, PRIMARY KEY)
-- - email (TEXT, UNIQUE, NOT NULL)
-- - name (TEXT)
-- - role (TEXT)
-- - isFirstLogin (BOOLEAN, DEFAULT true)
-- - created_at (TIMESTAMPTZ, DEFAULT now())
-- - updated_at (TIMESTAMPTZ, DEFAULT now())

-- Exemple de création de la table users si elle n'existe pas :
/*
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    isFirstLogin BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Politique RLS (Row Level Security) pour la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Permettre aux utilisateurs authentifiés de voir leur propre profil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Permettre aux administrateurs de voir tous les utilisateurs
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );
*/