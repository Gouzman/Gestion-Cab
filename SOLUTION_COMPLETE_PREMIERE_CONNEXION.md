# ✅ Correction Première Connexion - Structure Correcte

## 🔍 Problème Identifié

**Erreur** : `column "auth_password" of relation "profiles" does not exist`

**Cause** : Le code tentait de mettre à jour une colonne `auth_password` dans la table `profiles` qui n'existe pas.

## 📊 Structure Réelle du Système

### Table `profiles` (colonnes liées aux mots de passe) :
- ✅ `initial_password` TEXT - Mot de passe initial généré par l'admin (hashé)
- ✅ `must_change_password` BOOLEAN - Force le changement à la première connexion
- ✅ `has_custom_password` BOOLEAN - Indique si l'utilisateur a défini son propre mot de passe
- ✅ `last_password_change` TIMESTAMPTZ - Date du dernier changement
- ✅ `password_change_count` INTEGER - Nombre de changements
- ❌ `auth_password` - **N'EXISTE PAS et ne doit PAS exister**

### Table `auth.users` (Supabase Auth) :
- ✅ `encrypted_password` TEXT - Mot de passe personnalisé de l'utilisateur (hashé)

## 🔧 Logique du Système

### Première Connexion (Initial) :
1. L'utilisateur se connecte avec `initial_password`
2. `has_custom_password = false`
3. `must_change_password = true`

### Après Première Connexion :
1. Le nouveau mot de passe est hashé et stocké dans `auth.users.encrypted_password`
2. `has_custom_password = true`
3. `must_change_password = false`
4. L'utilisateur se connecte maintenant avec son mot de passe personnalisé

### Fonction `internal_login` :
```sql
IF NOT profile_record.has_custom_password THEN
  -- Vérifier contre initial_password
  password_match := (profile_record.initial_password = crypt(user_password, profile_record.initial_password));
ELSE
  -- Vérifier contre auth.users.encrypted_password
  password_match := (profile_record.auth_password = crypt(user_password, profile_record.auth_password));
END IF;
```

Note: `auth_password` est un **alias** dans le SELECT qui pointe vers `auth.users.encrypted_password`

## ✅ Corrections Appliquées

### Fichiers SQL Corrigés :
1. ✅ `sql/FIX_PASSWORD_HASH_AMBIGUOUS.sql` - **PRÊT À EXÉCUTER**
2. ✅ `sql/internal_auth_system.sql`
3. ✅ `sql/FIX_FIRST_LOGIN_AUTH_PASSWORD.sql`
4. ✅ `sql/FIX_FIRST_LOGIN_ROBUST.sql`
5. ✅ `sql/FIX_ADD_AUTH_PASSWORD_COLUMN.sql`

### Changement Principal :
**AVANT (❌ INCORRECT)** :
```sql
UPDATE public.profiles
SET 
  auth_password = password_hash,  -- ❌ Cette colonne n'existe pas
  must_change_password = false,
  ...
```

**APRÈS (✅ CORRECT)** :
```sql
-- Mot de passe stocké dans auth.users.encrypted_password (étape 4)
UPDATE public.profiles
SET 
  -- PAS de auth_password ici
  must_change_password = false,
  has_custom_password = true,
  ...
```

## 🚀 Déploiement

### Exécutez ce script dans Supabase SQL Editor :

**Fichier à utiliser** : `sql/FIX_PASSWORD_HASH_AMBIGUOUS.sql`

Ce script va :
1. ✅ Corriger la fonction `internal_set_personal_credentials`
2. ✅ Stocker le mot de passe dans `auth.users.encrypted_password`
3. ✅ Mettre à jour les flags dans `profiles` sans toucher à `auth_password`

### Après l'exécution :

1. **Rechargez l'application** : `Ctrl+Shift+R` ou `Cmd+Shift+R`
2. **Testez la première connexion** :
   - Email : [votre email]
   - Mot de passe initial : [celui généré par l'admin]
   - Définissez votre nouveau mot de passe
   - Définissez votre phrase secrète
   - Cliquez sur **Valider**

3. ✅ **Résultat attendu** :
   - Toast : "✅ Identifiants définis ! Bienvenue dans votre espace de travail."
   - Redirection automatique vers le dashboard
   - Le mot de passe est stocké dans `auth.users.encrypted_password`
   - `profiles.must_change_password = false`
   - `profiles.has_custom_password = true`

## 🔒 Sécurité Maintenue

- ✅ Les mots de passe sont hashés avec bcrypt (`gen_salt('bf')`)
- ✅ L'historique des mots de passe empêche la réutilisation
- ✅ La phrase secrète est chiffrée
- ✅ Aucune donnée sensible n'est exposée côté client
- ✅ La structure existante n'est pas modifiée

## ✅ Code Frontend

Le code frontend (`InternalAuthContext.jsx` et `FirstLoginScreen.jsx`) fonctionne correctement et n'a **PAS BESOIN** d'être modifié. Il appelle simplement la fonction RPC qui est maintenant corrigée.

---

**Prêt à déployer** : Exécutez `sql/FIX_PASSWORD_HASH_AMBIGUOUS.sql` maintenant ! 🚀
