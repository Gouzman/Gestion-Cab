# 🚨 FIX RAPIDE - Erreur SMTP Gmail BadCredentials

## ❌ Erreur constatée

```
535: 5.7.8 Username and Password not accepted
```

## 🔍 Cause

Les credentials SMTP Gmail ne sont **pas correctement configurés** dans Supabase.

---

## ✅ Solution (2 minutes)

### 1️⃣ Créer un App Password Gmail

**⚠️ N'utilisez PAS votre mot de passe Gmail normal !**

1. Aller sur : https://myaccount.google.com/apppasswords
2. Si le lien ne fonctionne pas :
   - Aller sur https://myaccount.google.com
   - Cliquer sur **"Sécurité"**
   - Activer la **"Validation en deux étapes"** (si pas déjà fait)
   - Retourner dans **"Sécurité"**
   - Cliquer sur **"Mots de passe des applications"**
3. Créer un nouveau mot de passe :
   - Nom : `Gestion Cabinet`
   - Copier le code généré (format : `xxxx xxxx xxxx xxxx`)

### 2️⃣ Configurer Supabase

```bash
# Dans votre terminal
cd /Users/gouzman/Documents/Gestion-Cab

# Configurer les secrets (REMPLACER avec vos vraies valeurs)
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Vérifier
supabase secrets list
```

**⚠️ Important :** Le `SMTP_PASSWORD` doit être le **App Password Gmail**, pas votre mot de passe Gmail normal !

### 3️⃣ Redéployer l'Edge Function

```bash
supabase functions deploy send-welcome-email
```

### 4️⃣ Tester

Créer un nouveau collaborateur et vérifier que l'email est envoyé.

---

## 🔍 Vérifications

### Vérifier les secrets configurés

```bash
supabase secrets list
```

Vous devriez voir :
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_HOSTNAME` (optionnel)
- `SMTP_PORT` (optionnel)

### Vérifier les logs

```bash
supabase functions logs send-welcome-email
```

---

## 📝 Exemple de configuration complète

```bash
# Exemple avec Gmail
supabase secrets set SMTP_USERNAME=elie.gouzou@gmail.com
supabase secrets set SMTP_PASSWORD=abcd-efgh-ijkl-mnop
supabase secrets set SMTP_HOSTNAME=smtp.gmail.com
supabase secrets set SMTP_PORT=465

# Redéployer
supabase functions deploy send-welcome-email
```

---

## 🆘 Si ça ne marche toujours pas

### Vérifier que l'App Password est correct

1. Retourner sur https://myaccount.google.com/apppasswords
2. Supprimer l'ancien mot de passe
3. Créer un nouveau
4. Reconfigurer dans Supabase

### Vérifier que la validation en 2 étapes est activée

Gmail **exige** la validation en deux étapes pour les App Passwords.

1. Aller sur https://myaccount.google.com/security
2. Activer **"Validation en deux étapes"**
3. Créer ensuite l'App Password

---

## ✅ Résolution

Une fois les secrets correctement configurés, l'erreur disparaîtra et les emails seront envoyés ! 🎉
