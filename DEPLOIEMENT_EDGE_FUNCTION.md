# 🚀 Guide de Déploiement de l'Edge Function

## ❌ Problème : Erreur CORS

**Erreur rencontrée :**
```
Access to fetch at 'https://api.resend.com/emails' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Cause :** L'API Resend ne peut pas être appelée directement depuis le navigateur pour des raisons de sécurité.

**Solution :** Utiliser une Supabase Edge Function (backend) pour envoyer les emails.

---

## ✅ Solution Appliquée

### Structure Créée

```
supabase/
└── functions/
    └── send-welcome-email/
        └── index.ts
```

### Modifications du Code

- ✅ `src/lib/emailService.js` : Appelle maintenant l'Edge Function au lieu de Resend directement
- ✅ Edge Function créée : `supabase/functions/send-welcome-email/index.ts`

---

## 📋 Déploiement de l'Edge Function

### Option 1 : Via Supabase CLI (Recommandé)

#### Étape 1 : Installer Supabase CLI

**Mac :**
```bash
brew install supabase/tap/supabase
```

**Windows :**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux :**
```bash
brew install supabase/tap/supabase
```

**Ou via npm (toutes plateformes) :**
```bash
npm install -g supabase
```

#### Étape 2 : Se Connecter à Supabase

```bash
supabase login
```

#### Étape 3 : Lier le Projet

```bash
# Dans le dossier du projet
cd /Users/gouzman/Documents/Gestion-Cab

# Lier au projet Supabase
supabase link --project-ref fhuzkubnxuetakpxkwlr
```

#### Étape 4 : Configurer le Secret Resend

```bash
supabase secrets set RESEND_API_KEY=re_4d7a9PFC_7m6gSEsAKwxxBZfCdXmeAzwm
```

#### Étape 5 : Déployer la Fonction

```bash
supabase functions deploy send-welcome-email
```

#### Étape 6 : Tester

```bash
# Test local
curl -i --location --request POST 'https://fhuzkubnxuetakpxkwlr.supabase.co/functions/v1/send-welcome-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

---

### Option 2 : Via Supabase Dashboard (Plus Simple)

Si vous ne voulez pas installer le CLI, vous pouvez déployer via le Dashboard :

#### Étape 1 : Aller dans le Dashboard

1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans **Edge Functions**

#### Étape 2 : Créer la Fonction

1. Cliquer sur **"New function"**
2. Nom : `send-welcome-email`
3. Copier-coller le contenu de `supabase/functions/send-welcome-email/index.ts`
4. Cliquer sur **"Deploy"**

#### Étape 3 : Configurer le Secret

1. Aller dans **Settings** → **Secrets**
2. Ajouter : `RESEND_API_KEY` = `re_4d7a9PFC_7m6gSEsAKwxxBZfCdXmeAzwm`
3. Sauvegarder

---

## 🧪 Test de la Fonction

### Dans l'Application

1. Aller dans **"Collaborateurs"**
2. Ajouter un utilisateur avec votre email
3. Vérifier la console :
   - ✅ `Email envoyé avec succès`
   - ❌ `Edge Function non disponible` (si pas déployée)

### Vérifier dans Supabase Dashboard

1. Edge Functions → `send-welcome-email`
2. Onglet **Logs**
3. Voir les appels récents

---

## 🔧 Dépannage

### Problème : "Edge Function non disponible"

**Cause :** La fonction n'est pas encore déployée.

**Solution :**
1. Vérifier que la fonction est déployée dans le Dashboard
2. Vérifier l'URL : `https://fhuzkubnxuetakpxkwlr.supabase.co/functions/v1/send-welcome-email`
3. Déployer via CLI ou Dashboard (voir ci-dessus)

### Problème : "RESEND_API_KEY not configured"

**Cause :** Le secret n'est pas configuré.

**Solution :**
```bash
supabase secrets set RESEND_API_KEY=re_4d7a9PFC_7m6gSEsAKwxxBZfCdXmeAzwm
```

### Problème : "Function not found"

**Cause :** La fonction n'est pas liée correctement.

**Solution :**
```bash
supabase link --project-ref fhuzkubnxuetakpxkwlr
supabase functions deploy send-welcome-email
```

---

## 📱 Test Manuel

### Via cURL

```bash
curl -X POST \
  'https://fhuzkubnxuetakpxkwlr.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXprdWJueHVldGFrcHhrd2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTE4MTEsImV4cCI6MjA3NDY4NzgxMX0.6_fLQrCtBdYAKNXgT2fAo6vHVfhe3DmISq7F-egfyUY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "votre.email@gmail.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": "re_..."
  }
}
```

---

## 🎯 Résultat Final

### Avant (CORS Error)
```
❌ Erreur CORS
❌ Impossible d'envoyer des emails
```

### Après (Edge Function)
```
✅ Pas d'erreur CORS
✅ Emails envoyés via backend sécurisé
✅ Clé API Resend protégée
```

---

## 📚 Ressources

**Supabase Edge Functions :** https://supabase.com/docs/guides/functions  
**Resend API :** https://resend.com/docs/api-reference/emails/send-email  
**Supabase CLI :** https://supabase.com/docs/guides/cli

---

## ⚠️ En Attendant le Déploiement

**L'application fonctionne toujours en mode DEBUG.**

- Les emails sont affichés dans la console
- Le mot de passe est visible dans les notifications
- Aucune interruption de service

**Une fois la fonction déployée, les emails seront envoyés automatiquement !**

