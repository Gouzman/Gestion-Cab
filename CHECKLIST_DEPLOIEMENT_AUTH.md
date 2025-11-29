# ✅ CHECKLIST DE DÉPLOIEMENT - SYSTÈME D'AUTHENTIFICATION INTERNE

## 📋 PRÉ-DÉPLOIEMENT

### Vérifications SQL

- [ ] Connexion à Supabase Dashboard
- [ ] Accès au SQL Editor
- [ ] Backup de la base de données effectué
- [ ] Permissions admin vérifiées

---

## 🔧 DÉPLOIEMENT (Étape par étape)

### Étape 1 : Exécuter les scripts SQL (15 min)

#### 1.1 Script principal : `sql/internal_auth_system.sql`

- [ ] Ouvrir Supabase SQL Editor
- [ ] Copier/coller le contenu de `sql/internal_auth_system.sql`
- [ ] Exécuter le script
- [ ] Vérifier le message de succès : ✅ Système d'authentification interne créé

**Vérification** :
```sql
-- Exécuter cette requête pour valider
SELECT tablename FROM pg_tables WHERE tablename = 'internal_sessions';
-- Résultat attendu : 1 ligne (internal_sessions)
```

- [ ] Table `internal_sessions` créée ✅

#### 1.2 Script utilisateur : `sql/create_auth_user_function.sql`

- [ ] Copier/coller le contenu de `sql/create_auth_user_function.sql`
- [ ] Exécuter le script
- [ ] Vérifier le message de succès : ✅ Fonction create_auth_user_with_profile créée

**Vérification** :
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_auth_user_with_profile';
-- Résultat attendu : 1 ligne
```

- [ ] Fonction `create_auth_user_with_profile` créée ✅

#### 1.3 Vérifier toutes les fonctions RPC

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'internal_login',
  'verify_internal_session',
  'internal_logout',
  'internal_set_personal_credentials',
  'get_secret_question',
  'verify_secret_answer_and_reset',
  'cleanup_expired_sessions',
  'create_auth_user_with_profile',
  'generate_initial_password'
);
-- Résultat attendu : 9 lignes
```

- [ ] Toutes les fonctions RPC existent (9/9) ✅

#### 1.4 Vérifier les RLS (Row Level Security)

```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename = 'internal_sessions';
-- Résultat attendu : 3 politiques
```

- [ ] RLS activé sur `internal_sessions` ✅

---

### Étape 2 : Redémarrer l'application (5 min)

#### 2.1 Arrêter l'application

```bash
# Si l'application tourne déjà
# Ctrl+C dans le terminal
```

- [ ] Application arrêtée ✅

#### 2.2 Vider le cache (optionnel mais recommandé)

```bash
cd /Users/gouzman/Documents/Gestion-Cab
rm -rf node_modules/.vite
rm -rf dist
```

- [ ] Cache vidé ✅

#### 2.3 Redémarrer en mode développement

```bash
npm run dev
```

- [ ] Application démarrée ✅
- [ ] Aucune erreur dans la console ✅
- [ ] URL d'accès affichée (ex: http://localhost:5173) ✅

---

## 🧪 TESTS FONCTIONNELS (30 min)

### Test 1 : Créer un utilisateur de test (5 min)

#### 1.1 Se connecter en tant qu'admin

- [ ] Ouvrir l'application dans le navigateur
- [ ] Se connecter avec un compte admin existant
- [ ] Accéder à l'interface `TeamManager`

#### 1.2 Créer un utilisateur

- [ ] Cliquer sur "Ajouter un membre"
- [ ] Remplir les champs :
  - Nom : `Test User`
  - Email : `testuser@example.com`
  - Rôle : `Collaborateur`
  - Fonction : `Avocat`
- [ ] Cliquer sur "Créer"
- [ ] ✅ Toast apparaît avec le mot de passe initial
- [ ] ✅ Bouton "Copier" fonctionne
- [ ] ✅ Mot de passe copié dans le presse-papier

**Noter le mot de passe** : ___________________

- [ ] Mot de passe noté ✅

#### 1.3 Approuver l'utilisateur

- [ ] Accéder à `PendingApprovals`
- [ ] Approuver l'utilisateur `testuser@example.com`
- [ ] ✅ Utilisateur approuvé

---

### Test 2 : Première connexion (10 min)

#### 2.1 Se déconnecter de l'admin

- [ ] Cliquer sur "Déconnexion"
- [ ] ✅ Redirection vers `LoginScreen`

#### 2.2 Se connecter avec le mot de passe générique

- [ ] Saisir :
  - Identifiant : `testuser@example.com`
  - Mot de passe : [mot de passe noté ci-dessus]
- [ ] Cliquer sur "Connexion"
- [ ] ✅ Message : "Changement de mot de passe requis"
- [ ] ✅ Redirection automatique vers `FirstLoginScreen`

#### 2.3 Définir le mot de passe personnel (Étape 1)

- [ ] Saisir un nouveau mot de passe (minimum 12 caractères)
  - Exemple : `MySecurePass123!@#`
- [ ] Confirmer le mot de passe
- [ ] ✅ Validation en temps réel s'affiche
- [ ] ✅ Bouton "Suivant" activé
- [ ] Cliquer sur "Suivant"

**Noter le nouveau mot de passe** : ___________________

#### 2.4 Définir la phrase secrète (Étape 2)

- [ ] Saisir une question :
  - Exemple : `Quel est le nom de votre premier animal de compagnie ?`
- [ ] Saisir une réponse :
  - Exemple : `Médor`
- [ ] Cliquer sur "Finaliser"
- [ ] ✅ Message : "Identifiants définis !"
- [ ] ✅ Connexion automatique
- [ ] ✅ Redirection vers Dashboard

**Noter la réponse secrète** : ___________________

---

### Test 3 : Connexion normale (5 min)

#### 3.1 Se déconnecter

- [ ] Cliquer sur "Déconnexion"
- [ ] ✅ Message : "Déconnexion réussie"
- [ ] ✅ Redirection vers `LoginScreen`

#### 3.2 Se reconnecter avec le nouveau mot de passe

- [ ] Saisir :
  - Identifiant : `testuser@example.com`
  - Mot de passe : [nouveau mot de passe noté]
- [ ] Cliquer sur "Connexion"
- [ ] ✅ Message : "Bienvenue !"
- [ ] ✅ Redirection vers Dashboard
- [ ] ✅ Pas de demande de changement de mot de passe

---

### Test 4 : Mot de passe oublié (10 min)

#### 4.1 Se déconnecter

- [ ] Cliquer sur "Déconnexion"

#### 4.2 Cliquer sur "Mot de passe oublié"

- [ ] Cliquer sur le lien "Mot de passe oublié ?"
- [ ] ✅ Redirection vers `ForgotPasswordScreen`

#### 4.3 Saisir l'identifiant (Étape 1)

- [ ] Saisir : `testuser@example.com`
- [ ] Cliquer sur "Suivant"
- [ ] ✅ Question secrète s'affiche
- [ ] ✅ Question correspond à celle saisie lors de la première connexion

#### 4.4 Tester avec une mauvaise réponse

- [ ] Saisir une mauvaise réponse : `MauvaiseRéponse`
- [ ] Saisir un nouveau mot de passe : `TempPassword123!`
- [ ] Cliquer sur "Réinitialiser"
- [ ] ✅ Message d'erreur : "La réponse est incorrecte"

#### 4.5 Saisir la bonne réponse

- [ ] Saisir la bonne réponse : [réponse secrète notée]
- [ ] Saisir un nouveau mot de passe : `NewPassword456!@#`
- [ ] Confirmer le mot de passe
- [ ] Cliquer sur "Réinitialiser"
- [ ] ✅ Message : "Mot de passe réinitialisé !"
- [ ] ✅ Retour automatique à `LoginScreen`

**Noter le nouveau mot de passe** : ___________________

#### 4.6 Se connecter avec le nouveau mot de passe

- [ ] Saisir :
  - Identifiant : `testuser@example.com`
  - Mot de passe : `NewPassword456!@#`
- [ ] Cliquer sur "Connexion"
- [ ] ✅ Connexion réussie

---

### Test 5 : Persistance de session (5 min)

#### 5.1 Vérifier la session en localStorage

- [ ] Ouvrir la console du navigateur (F12)
- [ ] Aller dans l'onglet "Application" > "Local Storage"
- [ ] Chercher la clé `internal_session_token`
- [ ] ✅ Token présent (longue chaîne de caractères)

#### 5.2 Rafraîchir la page

- [ ] Appuyer sur F5 (ou Ctrl+R / Cmd+R)
- [ ] ✅ L'utilisateur reste connecté
- [ ] ✅ Pas de redirection vers `LoginScreen`
- [ ] ✅ Dashboard s'affiche normalement

---

### Test 6 : Vérifications SQL (5 min)

#### 6.1 Vérifier la session dans la base

```sql
SELECT 
  s.id,
  s.session_token,
  s.expires_at,
  s.created_at,
  p.email,
  p.name
FROM public.internal_sessions s
JOIN public.profiles p ON p.id = s.user_id
WHERE p.email = 'testuser@example.com'
AND s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

- [ ] ✅ 1 session active trouvée
- [ ] ✅ `expires_at` = environ NOW() + 7 jours

#### 6.2 Vérifier le profil utilisateur

```sql
SELECT 
  email,
  name,
  must_change_password,
  has_custom_password,
  last_password_change,
  password_change_count
FROM public.profiles
WHERE email = 'testuser@example.com';
```

- [ ] ✅ `must_change_password` = false
- [ ] ✅ `has_custom_password` = true
- [ ] ✅ `last_password_change` = date récente
- [ ] ✅ `password_change_count` >= 2

#### 6.3 Vérifier la phrase secrète

```sql
SELECT 
  user_id,
  question_encrypted,
  created_at,
  updated_at
FROM public.user_secret_phrases
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'testuser@example.com');
```

- [ ] ✅ 1 ligne trouvée
- [ ] ✅ `question_encrypted` n'est pas vide (base64)

#### 6.4 Vérifier l'historique des mots de passe

```sql
SELECT 
  COUNT(*) as password_count
FROM public.password_history
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'testuser@example.com');
```

- [ ] ✅ Count >= 2 (mot de passe initial + resets)

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Requêtes de surveillance à exécuter quotidiennement

#### 1. Sessions actives

```sql
SELECT 
  COUNT(*) as active_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.internal_sessions
WHERE expires_at > NOW();
```

- [ ] Résultat noté : _____ sessions actives

#### 2. Tentatives de connexion échouées (dernières 24h)

```sql
SELECT 
  user_identifier,
  COUNT(*) as failed_attempts,
  MAX(attempted_at) as last_attempt
FROM public.login_attempts
WHERE 
  attempt_success = false
  AND attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY user_identifier
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

- [ ] Résultat noté : _____ utilisateurs avec tentatives échouées

#### 3. Sessions expirées à nettoyer

```sql
SELECT COUNT(*) as expired_sessions
FROM public.internal_sessions
WHERE expires_at < NOW();
```

- [ ] Résultat noté : _____ sessions expirées

**Action** : Exécuter le nettoyage si nécessaire
```sql
SELECT public.cleanup_expired_sessions();
```

---

## 🎯 CRITÈRES DE SUCCÈS

### ✅ Fonctionnalités validées

- [ ] ✅ Création d'utilisateur avec mot de passe générique
- [ ] ✅ Bouton copie du mot de passe générique
- [ ] ✅ Première connexion avec redirection automatique
- [ ] ✅ Définition du mot de passe personnel (2 étapes)
- [ ] ✅ Définition de la phrase secrète
- [ ] ✅ Connexion normale avec mot de passe personnel
- [ ] ✅ Déconnexion et suppression de session
- [ ] ✅ Mot de passe oublié avec phrase secrète
- [ ] ✅ Blocage des mauvaises réponses
- [ ] ✅ Réinitialisation du mot de passe
- [ ] ✅ Persistance de session (F5)
- [ ] ✅ Expiration de session (7 jours)

### 🔒 Sécurité validée

- [ ] ✅ Mots de passe hashés avec bcrypt
- [ ] ✅ Phrase secrète hashée
- [ ] ✅ Historique des mots de passe
- [ ] ✅ Pas de réutilisation de mot de passe
- [ ] ✅ Sessions sécurisées avec tokens aléatoires
- [ ] ✅ RLS activé sur `internal_sessions`
- [ ] ✅ Journalisation des tentatives de connexion

### 📈 Performance validée

- [ ] ✅ Temps de connexion < 2 secondes
- [ ] ✅ Pas d'erreur dans la console navigateur
- [ ] ✅ Pas d'erreur dans les logs Supabase
- [ ] ✅ Requêtes SQL optimisées (indexes utilisés)

---

## 🚨 EN CAS DE PROBLÈME

### Problème 1 : Erreur SQL lors de l'exécution des scripts

**Symptôme** : Message d'erreur dans Supabase SQL Editor

**Actions** :
1. Noter le message d'erreur exact
2. Vérifier les permissions (doit être admin)
3. Vérifier que les scripts sont exécutés dans l'ordre
4. Contacter le support si nécessaire

### Problème 2 : Application ne démarre pas

**Symptôme** : Erreur au `npm run dev`

**Actions** :
1. Vérifier les logs dans le terminal
2. Vérifier que `node_modules` existe (`npm install` si besoin)
3. Vérifier que le fichier `.env` existe avec les bonnes variables
4. Vider le cache : `rm -rf node_modules/.vite && npm run dev`

### Problème 3 : Fonction RPC introuvable

**Symptôme** : Erreur `function public.internal_login() does not exist`

**Actions** :
1. Vérifier que le script SQL a bien été exécuté
2. Exécuter la requête de vérification :
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'internal_login';
   ```
3. Si vide, ré-exécuter `sql/internal_auth_system.sql`

### Problème 4 : Session invalide au démarrage

**Symptôme** : "Session invalide ou expirée" malgré connexion récente

**Actions** :
1. Ouvrir la console navigateur (F12)
2. Exécuter : `localStorage.removeItem('internal_session_token')`
3. Rafraîchir la page (F5)
4. Se reconnecter

---

## 📝 ROLLBACK (EN CAS D'ÉCHEC CRITIQUE)

### ⚠️ Procédure de retour arrière

Si le nouveau système ne fonctionne pas et qu'il faut revenir à l'ancien :

#### 1. Restaurer l'ancien Context

```bash
# Dans main.jsx et App.jsx
# Remplacer :
import { AuthProvider } from '@/contexts/InternalAuthContext';
# Par :
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
```

#### 2. Redémarrer l'application

```bash
npm run dev
```

#### 3. Supprimer les données de test (optionnel)

```sql
DELETE FROM public.internal_sessions;
-- NE PAS supprimer les autres tables (profiles, etc.)
```

---

## ✅ VALIDATION FINALE

### Checklist complète

- [ ] ✅ Scripts SQL exécutés sans erreur
- [ ] ✅ Application redémarrée avec succès
- [ ] ✅ Test 1 : Création d'utilisateur ✅
- [ ] ✅ Test 2 : Première connexion ✅
- [ ] ✅ Test 3 : Connexion normale ✅
- [ ] ✅ Test 4 : Mot de passe oublié ✅
- [ ] ✅ Test 5 : Persistance de session ✅
- [ ] ✅ Test 6 : Vérifications SQL ✅
- [ ] ✅ Monitoring configuré ✅
- [ ] ✅ Documentation lue et comprise ✅

---

## 🎉 DÉPLOIEMENT RÉUSSI !

**Date de déploiement** : ___________________  
**Déployé par** : ___________________  
**Validé par** : ___________________  

**Commentaires** :
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Version** : 1.0.0  
**Dernière mise à jour** : 29 novembre 2025  
**Auteur** : Équipe de développement
