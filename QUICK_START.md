# 🚀 Guide de Démarrage Rapide - Authentification "Première Connexion"

## 📋 Étapes d'installation

### 1. Migration de base de données (OBLIGATOIRE)
Exécutez ce script dans l'éditeur SQL de Supabase :

```sql
-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    isFirstLogin BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter la colonne isFirstLogin si la table existe déjà
ALTER TABLE users ADD COLUMN IF NOT EXISTS isFirstLogin BOOLEAN DEFAULT true;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_first_login 
ON users(isFirstLogin) 
WHERE isFirstLogin = true;
```

### 2. Test rapide
1. Démarrez l'application : `npm run dev`
2. Rendez-vous sur la page de connexion
3. Le système va automatiquement créer des comptes de test

## 🧪 Comptes de test générés

### Administrateur (connexion normale)
- **Email** : `admin@gestion-cabinet.com`
- **Première connexion** : Non (`isFirstLogin = false`)
- **Comportement** : Connexion directe avec mot de passe

### Utilisateurs test (première connexion)
- **Email** : `avocat1@cabinet.com` 
- **Première connexion** : Oui (`isFirstLogin = true`)
- **Comportement** : Définition de mot de passe requise

- **Email** : `secretaire@cabinet.com`
- **Première connexion** : Oui (`isFirstLogin = true`)
- **Comportement** : Définition de mot de passe requise

## 🎯 Comment tester

### Test du flux "Première connexion"
1. Saisir : `avocat1@cabinet.com`
2. Cliquer "Continuer"
3. ➡️ **Redirection automatique** vers la page de définition de mot de passe
4. Saisir un mot de passe (min 8 caractères)
5. Confirmer le mot de passe
6. Cliquer "Valider"
7. ➡️ **Connexion automatique** vers le tableau de bord

### Test du flux "Connexion normale"
1. Saisir : `admin@gestion-cabinet.com`
2. Cliquer "Continuer"  
3. ➡️ **Affichage** du champ mot de passe
4. Saisir le mot de passe
5. Cliquer "Connexion"
6. ➡️ **Connexion** vers le tableau de bord

## ⚙️ Création de nouveaux utilisateurs

### Pour créer un utilisateur qui devra définir son mot de passe :
```sql
INSERT INTO users (email, name, role, isFirstLogin) 
VALUES ('nouvel.utilisateur@cabinet.com', 'Nom Utilisateur', 'avocat', true);
```

### Pour créer un utilisateur avec accès direct :
```sql
INSERT INTO users (email, name, role, isFirstLogin) 
VALUES ('utilisateur.direct@cabinet.com', 'Nom Utilisateur', 'admin', false);
```

## 🔍 Vérifications

### Vérifier les comptes créés :
```sql
SELECT email, name, role, isFirstLogin, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Vérifier les utilisateurs en attente de première connexion :
```sql
SELECT email, name, role 
FROM users 
WHERE isFirstLogin = true;
```

## 🚨 Points importants

- ✅ **Rétrocompatibilité** : Les utilisateurs existants ne sont pas impactés
- ✅ **Sécurité** : Les mots de passe sont hashés par Supabase Auth
- ✅ **UX fluide** : Redirection automatique selon le statut utilisateur
- ✅ **Validation** : Vérification de la correspondance des mots de passe

## 🛠️ Dépannage

### "Erreur de connexion à la base de données"
➡️ Vérifiez que la table `users` existe et que les variables d'environnement sont correctes

### "L'utilisateur n'existe pas"
➡️ L'email n'est pas dans la table `users`, créez-le via SQL ou l'interface admin

### "Impossible de définir le mot de passe"
➡️ Vérifiez les politiques RLS de Supabase et les permissions de la table

## 📞 Support
Si vous rencontrez des problèmes, vérifiez :
1. La console du navigateur pour les erreurs JavaScript
2. Les logs Supabase dans le dashboard
3. La structure de votre table `users`

---
**Le système est maintenant opérationnel ! 🎉**