# 🔐 SYSTÈME D'AUTHENTIFICATION INTERNE - GUIDE DE DÉPLOIEMENT

## 📝 RÉSUMÉ DES CHANGEMENTS

### ✅ Ce qui a été fait

1. **Suppression complète de l'authentification Supabase Auth**
   - ❌ Plus d'appels à `supabase.auth.signInWithPassword()`
   - ❌ Plus d'appels à `supabase.auth.signOut()`
   - ❌ Plus d'appels à `supabase.auth.getSession()`
   - ❌ Plus d'écoute de `supabase.auth.onAuthStateChange()`

2. **Nouveau système d'authentification interne 100%**
   - ✅ Table `internal_sessions` pour gérer les sessions
   - ✅ Fonction RPC `internal_login()` - Vérification mot de passe hashé
   - ✅ Fonction RPC `verify_internal_session()` - Validation token
   - ✅ Fonction RPC `internal_logout()` - Déconnexion
   - ✅ Fonction RPC `internal_set_personal_credentials()` - Première connexion
   - ✅ Tokens de session stockés en localStorage

3. **Nouveau Context React : `InternalAuthContext`**
   - Gestion complète de l'auth sans dépendance Supabase Auth
   - Méthodes : `signIn`, `signOut`, `setPersonalCredentials`, `getSecretQuestion`, `resetPasswordWithSecretPhrase`

4. **Composants mis à jour**
   - `LoginScreen.jsx` - Utilise `InternalAuthContext`
   - `FirstLoginScreen.jsx` - Utilise `InternalAuthContext`
   - `ForgotPasswordScreen.jsx` - Utilise `InternalAuthContext`
   - `App.jsx` - Import `InternalAuthContext`
   - `main.jsx` - Import `InternalAuthContext`
   - `Settings.jsx` - Import `InternalAuthContext`
   - `AdminUserHistory.jsx` - Import `InternalAuthContext`

---

## 🚀 ÉTAPES DE DÉPLOIEMENT

### Étape 1 : Exécuter les scripts SQL

Dans **Supabase SQL Editor**, exécutez ces fichiers dans l'ordre :

#### 1.1 Système de sessions internes
```sql
-- Fichier: sql/internal_auth_system.sql
```
Ce fichier crée :
- Table `internal_sessions`
- Fonctions RPC : `internal_login`, `verify_internal_session`, `internal_logout`, `internal_set_personal_credentials`

#### 1.2 Fonctions d'authentification existantes (si pas déjà fait)
```sql
-- Fichier: sql/new_auth_system_setup.sql
-- Fichier: sql/new_auth_functions.sql
```

#### 1.3 Fonction de création d'utilisateur
```sql
-- Fichier: sql/create_auth_user_function.sql
```

---

### Étape 2 : Vérifier les tables et fonctions

Exécutez ces requêtes SQL pour valider :

```sql
-- ✅ Vérifier la table internal_sessions
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename = 'internal_sessions';

-- ✅ Vérifier les fonctions RPC
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'internal_login',
  'verify_internal_session',
  'internal_logout',
  'internal_set_personal_credentials',
  'get_secret_question',
  'verify_secret_answer_and_reset',
  'create_auth_user_with_profile'
);

-- ✅ Vérifier les RLS sur internal_sessions
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'internal_sessions';
```

**Résultat attendu** :
- Table `internal_sessions` existe
- 7 fonctions RPC existent
- 3 politiques RLS sur `internal_sessions`

---

### Étape 3 : Redémarrer l'application React

```bash
cd /Users/gouzman/Documents/Gestion-Cab
npm run dev
```

---

## 🧪 TESTS D'ACCEPTATION

### Test 1 : Première connexion (utilisateur avec mot de passe générique)

**Prérequis** : Créer un utilisateur via `TeamManager`

1. **Action** : Se connecter avec email + mot de passe générique
2. **Résultat attendu** :
   - ✅ Message : "Changement de mot de passe requis"
   - ✅ Redirection automatique vers `FirstLoginScreen`
   - ✅ Étape 1 : Définir mot de passe (validation stricte)
   - ✅ Étape 2 : Définir phrase secrète
   - ✅ Connexion automatique après configuration
   - ✅ Redirection vers Dashboard

**SQL de vérification** :
```sql
SELECT 
  email,
  must_change_password,
  has_custom_password,
  last_password_change
FROM public.profiles
WHERE email = 'test@example.com';

-- Résultat attendu :
-- must_change_password = false
-- has_custom_password = true
-- last_password_change = NOW()
```

---

### Test 2 : Connexion normale (utilisateur avec mot de passe personnalisé)

1. **Action** : Se connecter avec email + mot de passe personnel
2. **Résultat attendu** :
   - ✅ Message : "Bienvenue !"
   - ✅ Redirection vers Dashboard
   - ✅ Session créée dans `internal_sessions`

**SQL de vérification** :
```sql
SELECT 
  s.session_token,
  s.user_id,
  s.expires_at,
  p.email,
  p.name
FROM public.internal_sessions s
JOIN public.profiles p ON p.id = s.user_id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;

-- Résultat attendu : 1 ligne avec session active
```

---

### Test 3 : Mot de passe oublié (avec phrase secrète)

1. **Action** : Cliquer sur "Mot de passe oublié"
2. **Action** : Saisir l'identifiant
3. **Résultat attendu** : Question secrète s'affiche
4. **Action** : Saisir la bonne réponse + nouveau mot de passe
5. **Résultat attendu** :
   - ✅ Message : "Mot de passe réinitialisé !"
   - ✅ Retour automatique à LoginScreen
   - ✅ Connexion possible avec nouveau mot de passe

**SQL de vérification** :
```sql
SELECT 
  user_id,
  question_encrypted,
  created_at,
  updated_at
FROM public.user_secret_phrases
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'test@example.com');

-- Résultat attendu : 1 ligne avec question encodée en base64
```

---

### Test 4 : Mauvaise réponse à la phrase secrète

1. **Action** : Cliquer sur "Mot de passe oublié"
2. **Action** : Saisir l'identifiant
3. **Action** : Saisir une mauvaise réponse
4. **Résultat attendu** :
   - ❌ Message : "La réponse est incorrecte"
   - ❌ Pas de changement de mot de passe

---

### Test 5 : Déconnexion

1. **Action** : Se connecter puis se déconnecter
2. **Résultat attendu** :
   - ✅ Message : "Déconnexion réussie"
   - ✅ Redirection vers LoginScreen
   - ✅ Session supprimée de `internal_sessions`
   - ✅ Token supprimé de localStorage

**SQL de vérification** :
```sql
-- Vérifier que la session a été supprimée
SELECT COUNT(*) FROM public.internal_sessions
WHERE session_token = 'TOKEN_ICI';

-- Résultat attendu : 0
```

---

### Test 6 : Persistance de session (rafraîchissement page)

1. **Action** : Se connecter
2. **Action** : Rafraîchir la page (F5)
3. **Résultat attendu** :
   - ✅ L'utilisateur reste connecté
   - ✅ Pas de redirection vers LoginScreen
   - ✅ Session vérifiée via `verify_internal_session`

---

### Test 7 : Expiration de session (après 7 jours)

**SQL de simulation** :
```sql
-- Forcer l'expiration d'une session
UPDATE public.internal_sessions
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'test@example.com');
```

1. **Action** : Rafraîchir la page
2. **Résultat attendu** :
   - ✅ Session expirée détectée
   - ✅ Déconnexion automatique
   - ✅ Redirection vers LoginScreen

---

## 📊 MONITORING

### Requêtes de surveillance

#### Nombre de sessions actives
```sql
SELECT 
  COUNT(*) as active_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.internal_sessions
WHERE expires_at > NOW();
```

#### Sessions par utilisateur
```sql
SELECT 
  p.email,
  p.name,
  COUNT(s.id) as session_count,
  MAX(s.last_activity) as last_seen
FROM public.profiles p
LEFT JOIN public.internal_sessions s ON s.user_id = p.id AND s.expires_at > NOW()
GROUP BY p.email, p.name
ORDER BY last_seen DESC NULLS LAST;
```

#### Tentatives de connexion échouées (dernières 24h)
```sql
SELECT 
  user_identifier,
  attempt_error,
  COUNT(*) as failed_attempts,
  MAX(attempted_at) as last_attempt
FROM public.login_attempts
WHERE 
  attempt_success = false
  AND attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY user_identifier, attempt_error
ORDER BY failed_attempts DESC;
```

#### Sessions expirées à nettoyer
```sql
SELECT COUNT(*) as expired_sessions
FROM public.internal_sessions
WHERE expires_at < NOW();

-- Pour nettoyer (à exécuter périodiquement via CRON) :
SELECT public.cleanup_expired_sessions();
```

---

## 🔧 DÉPANNAGE

### Problème 1 : "Session invalide ou expirée" au démarrage

**Cause** : Token localStorage corrompu ou expiré

**Solution** :
```javascript
// Dans la console du navigateur :
localStorage.removeItem('internal_session_token');
// Puis rafraîchir la page
```

---

### Problème 2 : "Utilisateur introuvable" malgré compte existant

**Vérification SQL** :
```sql
SELECT 
  p.email,
  p.admin_approved,
  p.must_change_password,
  u.email as auth_email,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'EMAIL_ICI';
```

**Solution** : Vérifier que :
- `admin_approved = true` (sauf pour admin)
- Un compte existe dans `auth.users` avec le même `id`

---

### Problème 3 : Mot de passe incorrect malgré mot de passe correct

**Vérification** :
```sql
SELECT 
  id,
  email,
  has_custom_password,
  initial_password IS NOT NULL as has_initial_password
FROM public.profiles
WHERE email = 'EMAIL_ICI';
```

**Cause possible** :
- Si `has_custom_password = false`, le système vérifie contre `initial_password`
- Si `has_custom_password = true`, le système vérifie contre `auth.users.encrypted_password`

**Solution** : Forcer un reset du mot de passe via phrase secrète

---

### Problème 4 : Fonction RPC introuvable

**Erreur** : `function public.internal_login() does not exist`

**Solution** : Exécuter `sql/internal_auth_system.sql` dans Supabase SQL Editor

---

## 🗑️ NETTOYAGE (ANCIEN SYSTÈME)

### Fichiers obsolètes (à conserver pour référence, mais non utilisés)

- ✅ `src/contexts/SupabaseAuthContext.jsx` - **REMPLACÉ** par `InternalAuthContext.jsx`

### Ce qui reste utilisé de Supabase

- ✅ Supabase Client (`supabase`) - Pour les requêtes SQL (RPC)
- ✅ Table `auth.users` - Stockage des mots de passe hashés (compatibilité)
- ✅ Table `public.profiles` - Informations utilisateur
- ❌ Plus d'utilisation de `supabase.auth.*` API

---

## 📈 MÉTRIQUES DE SUCCÈS

Après déploiement, vérifier :

1. ✅ **0 erreur** dans la console navigateur lors du login
2. ✅ **100% des connexions** passent par `internal_login()`
3. ✅ **0 appel** à `supabase.auth.signInWithPassword()`
4. ✅ Sessions créées dans `internal_sessions`
5. ✅ Temps de connexion < 2 secondes
6. ✅ Première connexion guidée fonctionne
7. ✅ Récupération par phrase secrète fonctionne

---

## 🎯 PROCHAINES ÉTAPES (OPTIONNELLES)

### Améliorations futures

1. **Rate limiting** - Limiter les tentatives de connexion
   - Utiliser la table `login_attempts`
   - Bloquer après 5 tentatives échouées

2. **Sessions multiples** - Permettre plusieurs sessions par utilisateur
   - Actuellement possible, mais pas d'interface de gestion

3. **Notification de connexion** - Alerter l'utilisateur d'une nouvelle session
   - Email ou notification in-app

4. **2FA (Two-Factor Auth)** - Ajouter une couche de sécurité
   - TOTP (Google Authenticator)
   - SMS

5. **Historique des sessions** - Interface admin pour voir toutes les sessions actives
   - Dashboard avec liste des utilisateurs connectés

---

**Version** : 1.0.0  
**Date** : 29 novembre 2025  
**Auteur** : Équipe de développement  
**Statut** : ✅ Prêt pour déploiement
