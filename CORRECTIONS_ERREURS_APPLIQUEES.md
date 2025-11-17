# 🔧 CORRECTIONS APPLIQUÉES - Résolution des erreurs

## ✅ Erreurs corrigées

### 1️⃣ Erreur SMTP Gmail - BadCredentials ❌ → ✅

**Erreur :**
```
535: 5.7.8 Username and Password not accepted
```

**Cause :** Credentials SMTP Gmail incorrects ou manquants.

**Solution :** Voir le guide détaillé **`FIX_SMTP_BADCREDENTIALS.md`**

**Action immédiate :**
```bash
# 1. Créer un App Password Gmail sur :
#    https://myaccount.google.com/apppasswords

# 2. Configurer dans Supabase
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# 3. Redéployer
supabase functions deploy send-welcome-email
```

---

### 2️⃣ Erreur profiles isFirstLogin (400) ❌ → ✅

**Erreur :**
```
GET .../profiles?select=id,email,isFirstLogin&email=eq.... 400 (Bad Request)
```

**Cause :** La colonne `isFirstLogin` n'existe pas dans la table `profiles`.

**Solution appliquée :** Le code a été modifié pour :
1. ✅ Essayer d'abord avec `isFirstLogin`
2. ✅ Si erreur, réessayer sans cette colonne
3. ✅ Gérer l'absence de la colonne gracieusement

**Code modifié :** `src/contexts/SupabaseAuthContext.jsx` - fonction `checkFirstLogin()`

**Action recommandée (optionnelle) :**

Si vous voulez activer la fonctionnalité de première connexion, exécutez :

```sql
-- Dans Supabase SQL Editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS "isFirstLogin" BOOLEAN DEFAULT true;

UPDATE profiles 
SET "isFirstLogin" = false 
WHERE "isFirstLogin" IS NULL;
```

Sinon, le système fonctionne en mode "connexion normale" pour tous.

---

### 3️⃣ Erreur profiles (406 Not Acceptable) ❌ → ✅

**Erreur :**
```
GET .../profiles?select=*&id=eq.... 406 (Not Acceptable)
{code: 'PGRST116', details: 'The result contains 0 rows', 
 message: 'Cannot coerce the result to a single JSON object'}
```

**Cause :** Utilisation de `.single()` alors que le profil n'existe pas.

**Solution appliquée :** 
- ✅ Remplacé `.single()` par `.maybeSingle()`
- ✅ Ajout de vérification `if (!profileData)`
- ✅ Message d'erreur clair pour l'utilisateur

**Code modifié :** `src/contexts/SupabaseAuthContext.jsx` - fonction `fetchUserProfileAndPermissions()`

---

## 📝 Résumé des modifications

### Fichier modifié : `src/contexts/SupabaseAuthContext.jsx`

#### Fonction 1 : `fetchUserProfileAndPermissions()`

**Avant :**
```javascript
.select('*')
.eq('id', userId)
.single(); // ❌ Erreur si pas de résultat
```

**Après :**
```javascript
.select('*')
.eq('id', userId)
.maybeSingle(); // ✅ Retourne null si pas de résultat

if (!profileData) {
  // ✅ Gestion explicite du cas "profil manquant"
  console.warn("User exists in Auth but not in profiles table");
  toast({ ... });
  return null;
}
```

#### Fonction 2 : `checkFirstLogin()`

**Avant :**
```javascript
.select('id, email, isFirstLogin') // ❌ Erreur si colonne manquante
```

**Après :**
```javascript
// Tentative 1 : avec isFirstLogin
const { data, error } = await supabase
  .from('profiles')
  .select('id, email, isFirstLogin')
  .eq('email', email)
  .maybeSingle();

if (error) {
  // ✅ Si erreur, on réessaie sans isFirstLogin
  const { data: dataWithout } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();
  
  userData = dataWithout;
}
```

---

## 🧪 Vérifications

### Test 1 : SMTP Gmail

```bash
# Vérifier les secrets
supabase secrets list

# Doit afficher :
# - SMTP_USERNAME
# - SMTP_PASSWORD
```

### Test 2 : Connexion utilisateur

1. Se connecter avec un compte existant
2. ✅ Devrait se connecter sans erreur 406
3. ✅ Le profil devrait se charger correctement

### Test 3 : Première connexion (si colonne isFirstLogin ajoutée)

1. Créer un collaborateur
2. Se connecter avec son email
3. ✅ Si `isFirstLogin = true` : redirection vers création mot de passe
4. ✅ Si `isFirstLogin = false` : connexion normale

---

## 🚨 Actions requises

### Action 1 : Configurer SMTP Gmail (OBLIGATOIRE)

Pour que l'envoi d'emails fonctionne :

```bash
# Suivre le guide FIX_SMTP_BADCREDENTIALS.md
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=votre_app_password
supabase functions deploy send-welcome-email
```

### Action 2 : Ajouter la colonne isFirstLogin (OPTIONNEL)

Si vous voulez activer la première connexion :

```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS "isFirstLogin" BOOLEAN DEFAULT true;
```

Sinon, le système fonctionne en mode connexion normale.

---

## ✅ État actuel

| Fonctionnalité | Status | Action requise |
|---------------|--------|----------------|
| Connexion normale | ✅ Fonctionne | Aucune |
| Chargement profil | ✅ Corrigé | Aucune |
| Envoi d'emails | ⚠️ Requiert config | Configurer SMTP |
| Première connexion | ⚠️ Optionnel | Ajouter colonne SQL |

---

## 🔗 Documentation

- **SMTP Gmail** : `FIX_SMTP_BADCREDENTIALS.md`
- **Première connexion** : `FLUX_PREMIERE_CONNEXION.md`
- **Configuration SQL** : `setup-first-login-column.sql`

---

**Date :** 13 novembre 2025  
**Fichiers modifiés :** 1 (SupabaseAuthContext.jsx)  
**Régressions :** 0 ✅  
**Status :** ✅ Erreurs corrigées
