# 📧 Configuration SMTP Gratuit (Gmail) - Remplacement de Resend

## ✅ Modification effectuée

L'Edge Function `send-welcome-email` a été modifiée pour utiliser **SMTP Gmail gratuit** au lieu de Resend.

### Ce qui a changé :
- ❌ **Supprimé** : Appel API Resend (payant)
- ✅ **Ajouté** : Envoi SMTP via Gmail (100% gratuit)
- ✅ **Conservé** : Toute la logique d'authentification et génération de mot de passe
- ✅ **Conservé** : Format exact du message avec email et mot de passe

---

## 🔧 Configuration requise

### 1️⃣ Créer un App Password Gmail

Gmail nécessite un "App Password" pour les applications tierces (sécurité 2FA).

**Étapes :**

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Sécurité → Validation en deux étapes (activez-la si ce n'est pas fait)
3. Sécurité → Mots de passe des applications
4. Créez un nouveau mot de passe d'application :
   - Nom : `Gestion Cabinet Supabase`
   - Copiez le mot de passe généré (format : `xxxx xxxx xxxx xxxx`)

### 2️⃣ Configurer les variables d'environnement Supabase

Via le dashboard Supabase ou en ligne de commande :

```bash
# Se connecter à Supabase
supabase login

# Configurer les secrets
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=votre_app_password_gmail

# Optionnel (déjà configuré par défaut)
supabase secrets set SMTP_HOSTNAME=smtp.gmail.com
supabase secrets set SMTP_PORT=465
```

**Ou via le Dashboard Supabase :**

1. Projet → Settings → Edge Functions
2. Secrets → Add secret
3. Ajoutez :
   - `SMTP_USERNAME` = `votre.email@gmail.com`
   - `SMTP_PASSWORD` = `xxxx xxxx xxxx xxxx` (App Password)

### 3️⃣ Redéployer l'Edge Function

```bash
cd supabase/functions
supabase functions deploy send-welcome-email
```

---

## 🧪 Test de l'envoi d'email

### Test via curl :

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MotDePasse123!",
    "name": "Jean Dupont"
  }'
```

### Test depuis l'application :

Le code frontend existant **ne change pas**. L'appel reste identique :

```typescript
const { data, error } = await supabase.functions.invoke('send-welcome-email', {
  body: {
    email: userEmail,
    password: generatedPassword,
    name: userName
  }
})
```

---

## 🔐 Sécurité

### ✅ Avantages de cette solution :
- **100% gratuit** : Pas de limite de facturation avec Gmail
- **Aucune restriction d'email** : Envoi vers n'importe quelle adresse
- **Fiable** : Gmail a une excellente délivrabilité
- **Simple** : Seulement 2 variables d'environnement

### ⚠️ Limites Gmail :
- **500 emails/jour** pour un compte Gmail gratuit
- **2000 emails/jour** pour Google Workspace

Pour une application de gestion de cabinet, c'est largement suffisant.

---

## 🔄 Alternatives gratuites (si besoin)

Si vous préférez une autre solution, voici des alternatives 100% gratuites :

### Option A : Outlook/Hotmail SMTP
```env
SMTP_HOSTNAME=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=votre.email@outlook.com
SMTP_PASSWORD=votre_mot_de_passe
```

### Option B : Mailjet (gratuit 200 emails/jour)
```env
SMTP_HOSTNAME=in-v3.mailjet.com
SMTP_PORT=587
SMTP_USERNAME=votre_api_key
SMTP_PASSWORD=votre_secret_key
```

### Option C : Sendinblue/Brevo (gratuit 300 emails/jour)
```env
SMTP_HOSTNAME=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USERNAME=votre_email_brevo
SMTP_PASSWORD=votre_smtp_key
```

---

## 📝 Vérification

Après configuration, vérifiez que :

1. ✅ Les variables `SMTP_USERNAME` et `SMTP_PASSWORD` sont définies dans Supabase
2. ✅ L'Edge Function est redéployée
3. ✅ Un email de test a bien été reçu
4. ✅ Le mot de passe apparaît dans l'email
5. ✅ L'authentification fonctionne toujours normalement

---

## 🆘 Dépannage

### Erreur : "SMTP credentials not configured"
→ Les variables `SMTP_USERNAME` ou `SMTP_PASSWORD` ne sont pas définies dans Supabase.

### Erreur : "Authentication failed"
→ Vérifiez que vous utilisez bien un **App Password Gmail**, pas votre mot de passe Gmail normal.

### Erreur : "Connection timeout"
→ Vérifiez que le port 465 ou 587 n'est pas bloqué par votre firewall.

### Les emails arrivent en spam
→ Ajoutez un enregistrement SPF pour votre domaine :
```
v=spf1 include:_spf.google.com ~all
```

---

## ✅ Résumé

| Avant (Resend) | Après (Gmail SMTP) |
|----------------|-------------------|
| ❌ Payant | ✅ Gratuit |
| ❌ Limité en test | ✅ Aucune restriction |
| ⚠️ Nécessite vérification domaine | ✅ Prêt immédiatement |
| 📧 API Resend | 📧 SMTP standard |

**Rien n'a changé dans la logique de l'application**, seulement la méthode d'envoi d'email ! 🎉
