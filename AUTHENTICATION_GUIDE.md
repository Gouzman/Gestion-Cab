# Système d'Authentification "Première Connexion" - Guide

## 🎯 Vue d'ensemble

Le système d'authentification a été modernisé pour supporter un flux de "première connexion" où :

1. **Les administrateurs créent les comptes utilisateurs** depuis le back-office
2. **Les utilisateurs définissent leur propre mot de passe** lors de leur première connexion
3. **Aucune modification** des flux existants pour les utilisateurs ayant déjà un mot de passe

## 🏗️ Architecture

### Structure de la table `users`
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    isFirstLogin BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Flux d'authentification

#### 1. Première connexion (isFirstLogin = true)
```
Email saisi → Vérification dans table users → isFirstLogin = true → SetPasswordScreen
                                           ↓
Mot de passe défini → Création dans Supabase Auth → Mise à jour isFirstLogin = false → Connexion automatique
```

#### 2. Connexion normale (isFirstLogin = false)
```
Email saisi → Vérification dans table users → isFirstLogin = false → Champ mot de passe affiché → Connexion Supabase Auth
```

## 🔧 Composants modifiés

### 1. `LoginScreen.jsx`
- **Nouveau** : Étape de vérification email
- **Nouveau** : Redirection vers SetPasswordScreen si nécessaire
- **Conservé** : Flux de connexion normale

### 2. `SetPasswordScreen.jsx` (nouveau)
- Interface de définition du premier mot de passe
- Validation des mots de passe (minimum 8 caractères)
- Confirmation de saisie
- Création automatique du compte Supabase Auth

### 3. `SupabaseAuthContext.jsx`
- **Nouvelle méthode** : `checkFirstLogin(email)` - Vérifie si c'est une première connexion
- **Nouvelle méthode** : `setFirstPassword(email, password)` - Définit le premier mot de passe
- **Conservé** : Toutes les méthodes existantes (`signIn`, `signOut`, etc.)

### 4. `AdminAccountCreator.jsx`
- **Modifié** : Crée les comptes dans la table `users` au lieu de Supabase Auth
- **Nouveau** : Génère des comptes de test avec `isFirstLogin = true`

## 🗄️ Migration de base de données

### Script SQL requis
```sql
-- Ajouter la colonne isFirstLogin
ALTER TABLE users ADD COLUMN IF NOT EXISTS isFirstLogin BOOLEAN DEFAULT true;

-- Mettre à jour les utilisateurs existants
UPDATE users SET isFirstLogin = false WHERE isFirstLogin IS NULL;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_first_login ON users(isFirstLogin) WHERE isFirstLogin = true;
```

## 🧪 Tests à effectuer

### Test 1 : Première connexion
1. Utiliser l'email : `avocat1@cabinet.com` (créé avec `isFirstLogin = true`)
2. Saisir l'email → Devrait rediriger vers SetPasswordScreen
3. Définir un mot de passe → Devrait connecter automatiquement

### Test 2 : Connexion normale
1. Utiliser l'email : `admin@gestion-cabinet.com` (créé avec `isFirstLogin = false`)
2. Saisir l'email → Devrait afficher le champ mot de passe
3. Saisir le mot de passe → Connexion normale

### Test 3 : Utilisateur inexistant
1. Utiliser un email non enregistré
2. Saisir l'email → Devrait passer au mode connexion normale
3. Tentative de connexion → Erreur Supabase normale

## 🔒 Sécurité

### Points de sécurité implémentés
- ✅ Validation côté client (longueur mot de passe, confirmation)
- ✅ Vérification d'existence utilisateur avant première connexion
- ✅ Mise à jour automatique du statut `isFirstLogin`
- ✅ Création sécurisée dans Supabase Auth après validation

### Points à considérer pour la production
- 🔧 Ajouter des politiques RLS (Row Level Security) sur la table `users`
- 🔧 Implémenter une validation côté serveur pour le mot de passe
- 🔧 Ajouter un système d'expiration des comptes en attente
- 🔧 Logs d'audit pour les créations de comptes

## 📝 Utilisation

### Pour les administrateurs
1. Créer un nouvel utilisateur dans la table `users` avec `isFirstLogin = true`
2. Communiquer l'email à l'utilisateur
3. L'utilisateur définira son mot de passe lors de sa première connexion

### Pour les utilisateurs
1. Recevoir l'email de la part de l'administrateur
2. Se rendre sur la page de connexion
3. Saisir son email
4. Si première connexion : définir son mot de passe
5. Si compte existant : saisir son mot de passe habituel

## 🚀 Déploiement

### Étapes de déploiement
1. ✅ Exécuter le script SQL dans Supabase
2. ✅ Déployer le code frontend
3. ✅ Tester avec les comptes de démonstration
4. ✅ Créer les vrais comptes utilisateurs
5. ✅ Former les utilisateurs sur le nouveau processus

### Rétrocompatibilité
Le système est **100% rétrocompatible** :
- Les utilisateurs existants avec `isFirstLogin = false` continuent de se connecter normalement
- Aucun impact sur les sessions actives
- Les méthodes d'authentification existantes restent inchangées