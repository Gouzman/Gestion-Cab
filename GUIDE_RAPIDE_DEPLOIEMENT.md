# 🚀 GUIDE RAPIDE - DÉPLOIEMENT EN 3 ÉTAPES

## ❌ PROBLÈME ACTUEL

Les 3 scénarios ne fonctionnent pas car **les fonctions RPC n'existent pas encore dans Supabase**.

```
Erreur probable dans la console :
"function public.internal_login() does not exist"
```

---

## ✅ SOLUTION EN 3 ÉTAPES (5 MINUTES)

### ÉTAPE 1 : Ouvrir Supabase Dashboard (1 min)

1. Aller sur https://supabase.com
2. Se connecter à votre compte
3. Sélectionner votre projet
4. Cliquer sur **"SQL Editor"** dans le menu de gauche

---

### ÉTAPE 2 : Exécuter le script de déploiement (2 min)

1. Dans le SQL Editor, cliquer sur **"New query"**
2. Ouvrir le fichier : `sql/DEPLOIEMENT_AUTOMATIQUE.sql`
3. **Copier tout le contenu** du fichier
4. **Coller** dans le SQL Editor de Supabase
5. Cliquer sur le bouton **"Run"** (ou Ctrl+Enter)

**Résultat attendu** :
```
✅ Table internal_sessions créée
✅ Politique "Users can view own sessions" créée
✅ Politique "Allow session creation" créée
✅ Politique "Users can delete own sessions" créée
✅ Fonction: internal_login
✅ Fonction: verify_internal_session
✅ Fonction: internal_logout
✅ Fonction: internal_set_personal_credentials
🎉 Le système d'authentification interne est maintenant déployé!
```

---

### ÉTAPE 3 : Tester l'application (2 min)

1. Ouvrir votre navigateur
2. Aller sur `http://localhost:3002` (ou le port affiché dans le terminal)
3. **Tester la connexion** avec vos identifiants

---

## 🧪 SCÉNARIOS À TESTER

### ✅ Scénario 1 : Première connexion

**Si vous n'avez pas encore de compte** :

1. Se connecter en tant qu'admin
2. Aller dans "Équipe" → "Ajouter un membre"
3. Créer un utilisateur (noter le mot de passe généré)
4. Approuver l'utilisateur dans "Validations en attente"
5. Se déconnecter
6. **Se connecter avec le nouveau compte** :
   - Email : [celui que vous avez créé]
   - Mot de passe : [mot de passe généré]
7. **Résultat attendu** : Redirection vers FirstLoginScreen
8. Définir un nouveau mot de passe + phrase secrète

---

### ✅ Scénario 2 : Connexion normale

1. Se connecter avec :
   - Email : [votre email]
   - Mot de passe : [votre mot de passe personnel]
2. **Résultat attendu** : Connexion réussie → Dashboard

---

### ✅ Scénario 3 : Mot de passe oublié

1. Sur l'écran de connexion, cliquer sur **"Mot de passe oublié ?"**
2. Saisir votre email
3. **Résultat attendu** : Question secrète s'affiche
4. Répondre à la question
5. Définir un nouveau mot de passe
6. **Résultat attendu** : Retour à l'écran de connexion
7. Se connecter avec le nouveau mot de passe

---

## 🔍 VÉRIFICATION RAPIDE

### Vérifier que les fonctions existent

Dans Supabase SQL Editor, exécutez :

```sql
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'internal_login',
  'verify_internal_session',
  'internal_logout',
  'internal_set_personal_credentials'
);
```

**Résultat attendu** : 4 lignes

---

### Vérifier que la table existe

```sql
SELECT tablename 
FROM pg_tables 
WHERE tablename = 'internal_sessions';
```

**Résultat attendu** : 1 ligne

---

## ❌ EN CAS DE PROBLÈME

### Problème 1 : "function does not exist"

**Solution** : Vous n'avez pas exécuté le script SQL
- Retournez à l'ÉTAPE 2 et exécutez `sql/DEPLOIEMENT_AUTOMATIQUE.sql`

---

### Problème 2 : "Table internal_sessions does not exist"

**Solution** : Le script SQL a échoué
- Vérifiez les permissions (vous devez être admin)
- Réexécutez le script

---

### Problème 3 : Erreur "permission denied"

**Solution** : Vous n'avez pas les droits admin
- Connectez-vous avec un compte admin Supabase
- Ou contactez l'administrateur du projet

---

### Problème 4 : Rien ne se passe après le script

**Solution** : Rafraîchir l'application
1. Dans le navigateur, appuyer sur **Ctrl+Shift+R** (ou Cmd+Shift+R sur Mac)
2. Ou vider le cache : 
   - Chrome : Ctrl+Shift+Delete
   - Firefox : Ctrl+Shift+Delete

---

## 📱 CONTACTS

**En cas de blocage** :
1. Vérifier les logs dans la console du navigateur (F12)
2. Vérifier les logs dans Supabase Dashboard → Logs
3. Consulter la documentation complète : `GUIDE_DEPLOIEMENT_AUTH_INTERNE.md`

---

## ✅ CHECKLIST RAPIDE

- [ ] ✅ Script SQL exécuté dans Supabase
- [ ] ✅ Message de succès affiché
- [ ] ✅ Fonctions RPC vérifiées (4 fonctions)
- [ ] ✅ Table internal_sessions vérifiée
- [ ] ✅ Application rafraîchie
- [ ] ✅ Test de connexion réussi

---

**Si vous cochez toutes les cases, le système est opérationnel !** 🎉

---

**Version** : 1.0.0  
**Date** : 29 novembre 2025  
**Temps de déploiement** : ~5 minutes
