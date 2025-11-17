# 🔧 Guide de Résolution des Erreurs Supabase

## ❌ Erreurs Rencontrées

### 1. Erreur 400 sur `/profiles?select=id,email,isFirstLogin`
```
GET https://[...].supabase.co/rest/v1/profiles?select=id,email,isFirstLogin 400 (Bad Request)
```

**Cause :** La colonne `isFirstLogin` n'existe pas dans votre table `profiles`.

**Impact :** Aucun, le code gère cette erreur silencieusement.

**Solutions :**

#### Option A : Ajouter la colonne (recommandé)
1. Aller dans Supabase Dashboard → SQL Editor
2. Exécuter le script : `sql/add_isFirstLogin_column.sql`
3. Vérifier que la colonne a été créée

#### Option B : Ignorer (déjà géré)
- Le code détecte automatiquement l'absence de la colonne
- Continue le flux de connexion sans bloquer
- Pas de fonctionnalité "première connexion", mais tout fonctionne

---

### 2. Erreur 400 sur `/auth/v1/token?grant_type=password`
```
POST https://[...].supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
Error: invalid_credentials - "Invalid login credentials"
```

**Cause :** Email ou mot de passe incorrect.

**Solutions :**

#### ✅ Vérifier les identifiants
1. **Email correct ?** Vérifiez l'orthographe
2. **Mot de passe correct ?** Sensible à la casse
3. **Compte existe ?** Vérifiez dans Supabase Dashboard → Authentication → Users

#### ✅ Créer un compte de test
```sql
-- Dans Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'votre.email@exemple.com',
  crypt('votremotdepasse', gen_salt('bf')),
  NOW()
);
```

**OU** utiliser l'interface Supabase Dashboard :
1. Authentication → Users
2. "Add user" → Email & Password
3. Activer "Auto Confirm User"

#### ✅ Réinitialiser le mot de passe
1. Cliquer sur **"Mot de passe oublié ?"** dans l'interface
2. Entrer votre email
3. Suivre le lien reçu par email

---

## ✅ Corrections Appliquées au Code

### 1. Gestion d'erreur améliorée dans `checkFirstLogin()`

**Avant :**
```javascript
if (error) {
  console.error("Error checking first login:", error);
  return { isFirstLogin: false, error: null };
}
```

**Après :**
```javascript
if (error) {
  // Erreur silencieuse : colonne manquante ou autre problème
  console.debug("checkFirstLogin: colonne isFirstLogin non disponible ou erreur ignorée");
  return { isFirstLogin: false, error: null };
}
```

**Résultat :** Moins de bruit dans la console, erreur gérée proprement.

---

### 2. Messages d'erreur plus clairs dans `signIn()`

**Ajout de la détection :**
```javascript
if (error.message.includes("Invalid login credentials") || 
    error.message.includes("invalid_credentials")) {
  description = "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
} else if (error.message.includes("User not found")) {
  description = "Aucun compte n'existe avec cet email.";
}
```

**Résultat :** L'utilisateur comprend exactement quel est le problème.

---

## 🔍 Comment Déboguer

### Vérifier si un compte existe

**Option 1 : Via Supabase Dashboard**
1. Aller dans Authentication → Users
2. Chercher l'email : `nascentia.info@gmail.com`
3. Si absent → créer le compte

**Option 2 : Via SQL**
```sql
-- Vérifier dans auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'nascentia.info@gmail.com';

-- Vérifier dans profiles
SELECT id, email, name, role
FROM profiles
WHERE email = 'nascentia.info@gmail.com';
```

---

### Vérifier la structure de la table profiles

```sql
-- Lister toutes les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Colonnes attendues :**
- `id` (uuid, primary key)
- `email` (text)
- `name` (text)
- `role` (text)
- `function` (text)
- `title` (text)
- `isFirstLogin` (boolean) ← **OPTIONNELLE**
- `created_at` (timestamp)

---

### Tester la connexion manuellement

**Dans la console du navigateur (F12) :**
```javascript
// Test de connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'votre.email@exemple.com',
  password: 'votremotdepasse'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

## 📋 Checklist de Résolution

### Pour l'erreur `profiles.isFirstLogin` :
- [ ] Exécuter `sql/add_isFirstLogin_column.sql` (optionnel)
- [ ] Ou ignorer (le code gère l'absence)

### Pour l'erreur `invalid_credentials` :
- [ ] Vérifier que le compte existe dans Supabase
- [ ] Vérifier l'email (orthographe exacte)
- [ ] Vérifier le mot de passe (sensible à la casse)
- [ ] Créer un compte de test si nécessaire
- [ ] Utiliser "Mot de passe oublié" si besoin

---

## 🎯 Résultat Attendu

Après ces corrections :

✅ **L'erreur 400 sur `/profiles`** ne bloque plus l'application  
✅ **L'erreur 400 sur `/auth/v1/token`** affiche un message clair  
✅ **L'utilisateur comprend** pourquoi la connexion échoue  
✅ **Le flux de connexion** fonctionne normalement avec ou sans la colonne `isFirstLogin`  

---

## 🆘 Si le Problème Persiste

### 1. Vérifier les variables d'environnement
```bash
# Dans .env.local
VITE_SUPABASE_URL=https://[votre-projet].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

### 2. Vérifier les RLS (Row Level Security)
```sql
-- Désactiver temporairement pour tester
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Réactiver après le test
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 3. Vérifier les logs Supabase
1. Supabase Dashboard → Logs
2. Filtrer par "Auth"
3. Chercher les erreurs récentes

---

## 📞 Support

Si vous avez toujours des problèmes :
1. Vérifiez que Supabase est accessible (https://status.supabase.com)
2. Consultez la documentation : https://supabase.com/docs/guides/auth
3. Vérifiez les logs dans la console du navigateur (F12)

---

**Date de création :** 13 novembre 2025  
**Version :** 1.0  
**Statut :** ✅ Corrections appliquées
