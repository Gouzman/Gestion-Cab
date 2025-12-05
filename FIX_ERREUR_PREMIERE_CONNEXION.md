# 🔧 Correction Erreur Première Connexion

**Erreur rencontrée** : `technical_error` lors de la validation de la première connexion

## 🔍 Diagnostic

L'erreur `technical_error` indique qu'il y a un problème dans la fonction SQL `internal_set_personal_credentials`.

### Causes possibles :

1. ❌ La colonne `auth_password` n'existe pas dans `profiles`
2. ❌ La table `password_history` n'existe pas
3. ❌ La table `user_secret_phrases` n'existe pas
4. ❌ L'extension `pgcrypto` n'est pas activée

## 📋 Étape 1 : Diagnostic

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Copiez le contenu de sql/DIAGNOSTIC_FIRST_LOGIN.sql
```

Ce script va vérifier :
- ✅ Les colonnes de la table `profiles`
- ✅ L'existence des tables `password_history` et `user_secret_phrases`
- ✅ La fonction `internal_set_personal_credentials`
- ✅ L'extension `pgcrypto`

## 🔧 Étape 2 : Correction

### Option A : Version Robuste (Recommandée)

Cette version fonctionne même si certaines tables n'existent pas :

```sql
-- Exécutez sql/FIX_FIRST_LOGIN_ROBUST.sql dans Supabase SQL Editor
```

**Avantages** :
- ✅ Fonctionne avec ou sans `password_history`
- ✅ Fonctionne avec ou sans `user_secret_phrases`
- ✅ Détecte automatiquement si `auth_password` existe
- ✅ Messages d'erreur détaillés

### Option B : Version Standard

Si toutes les tables existent :

```sql
-- Exécutez sql/FIX_FIRST_LOGIN_AUTH_PASSWORD.sql dans Supabase SQL Editor
```

## 🧪 Étape 3 : Test

1. **Recharger l'application** : `Ctrl+Shift+R` ou `Cmd+Shift+R`

2. **Tester la première connexion** :
   - Connectez-vous avec un utilisateur qui a `must_change_password = true`
   - Définissez votre nouveau mot de passe
   - Définissez votre phrase secrète
   - Cliquez sur **Valider**

3. **Vérifier les logs** :
   - Ouvrez la console (F12)
   - Si une erreur persiste, vous verrez maintenant un message détaillé avec :
     - `error` : Le type d'erreur
     - `message` : Le message PostgreSQL
     - `detail` : Le code d'erreur SQL (SQLSTATE)
     - `hint` : Un indice pour résoudre le problème

## 📊 Comprendre les erreurs

### Erreur : "column auth_password does not exist"

**Solution** : Ajoutez la colonne `auth_password` à la table `profiles` :

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_password TEXT;
```

### Erreur : "relation password_history does not exist"

**Solution** : Utilisez la version robuste (`FIX_FIRST_LOGIN_ROBUST.sql`) qui gère ce cas.

Ou créez la table :

```sql
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_history_user_id ON public.password_history(user_id);
```

### Erreur : "relation user_secret_phrases does not exist"

**Solution** : Utilisez la version robuste (`FIX_FIRST_LOGIN_ROBUST.sql`) qui gère ce cas.

Ou créez la table :

```sql
CREATE TABLE IF NOT EXISTS public.user_secret_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_encrypted TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_secret_phrases_user_id ON public.user_secret_phrases(user_id);
```

### Erreur : "function gen_salt does not exist"

**Solution** : Activez l'extension `pgcrypto` :

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 🎯 Résultat Attendu

Après la correction, lors de la première connexion :

1. ✅ L'utilisateur définit son mot de passe
2. ✅ L'utilisateur définit sa phrase secrète
3. ✅ Clic sur "Valider"
4. ✅ Toast de succès : "✅ Identifiants définis ! Bienvenue dans votre espace de travail."
5. ✅ Redirection automatique vers le dashboard
6. ✅ `must_change_password = false` dans la base de données

## 🔍 Logs de Debug

Le frontend affiche maintenant des logs détaillés dans la console :

```
🔵 [FirstLogin] Définition des identifiants personnels...
✅ [FirstLogin] Identifiants définis avec succès
```

En cas d'erreur :

```
❌ [FirstLogin] Erreur lors de la définition des identifiants: technical_error
❌ [setPersonalCredentials] Erreur: {
  error: "technical_error",
  message: "column auth_password does not exist",
  detail: "42703",
  fullData: {...}
}
```

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Exécutez le diagnostic complet : `sql/DIAGNOSTIC_FIRST_LOGIN.sql`
2. Vérifiez les logs de la console navigateur
3. Copiez les détails de l'erreur (error, message, detail)
4. Partagez ces informations pour un diagnostic plus précis

---

**Fichiers créés** :
- ✅ `sql/FIX_FIRST_LOGIN_ROBUST.sql` - Correction robuste
- ✅ `sql/FIX_FIRST_LOGIN_AUTH_PASSWORD.sql` - Correction standard
- ✅ `sql/DIAGNOSTIC_FIRST_LOGIN.sql` - Script de diagnostic
- ✅ `src/contexts/InternalAuthContext.jsx` - Logs détaillés ajoutés
- ✅ `src/components/FirstLoginScreen.jsx` - Logs détaillés ajoutés
