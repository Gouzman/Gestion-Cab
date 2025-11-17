# ⚡ Démarrage Rapide - SMTP Gmail Gratuit

## 🎯 Ce qui a été fait

✅ **Resend (payant) → Gmail SMTP (gratuit)**
- Remplacement complet de l'API Resend
- Conservation de TOUTE la logique d'authentification
- Aucun changement dans le frontend
- Format d'email identique (avec mot de passe inclus)

---

## 🚀 Configuration en 3 minutes

### 1️⃣ Obtenir un App Password Gmail (30 secondes)

1. Allez sur : https://myaccount.google.com/apppasswords
2. Créez un mot de passe pour "Gestion Cabinet"
3. Copiez le code (format : `xxxx xxxx xxxx xxxx`)

### 2️⃣ Configurer Supabase (1 minute)

**Option A - Via le script automatique :**

```bash
cd /Users/gouzman/Documents/Gestion-Cab
./deploy-smtp-function.sh
```

**Option B - Manuellement :**

```bash
# Configurer les secrets
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Déployer
supabase functions deploy send-welcome-email
```

### 3️⃣ Tester (30 secondes)

Créez un nouvel utilisateur depuis votre application → l'email est envoyé automatiquement via Gmail ! 🎉

---

## 📋 Checklist de vérification

- [ ] App Password Gmail créé
- [ ] `SMTP_USERNAME` configuré dans Supabase
- [ ] `SMTP_PASSWORD` configuré dans Supabase
- [ ] Edge Function redéployée
- [ ] Test d'envoi réussi
- [ ] Email reçu avec mot de passe visible

---

## 📧 Format de l'email (inchangé)

```
Bonjour [Nom],

Votre compte a été créé avec succès sur la plateforme Gestion de Cabinet.

Vos identifiants de connexion :
━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email : user@example.com
🔑 Mot de passe : GeneratedPass123!
━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Pour des raisons de sécurité, nous vous recommandons...
```

---

## 🔍 Comparaison

| Aspect | Avant (Resend) | Après (Gmail SMTP) |
|--------|---------------|-------------------|
| **Coût** | 💰 Payant | ✅ Gratuit |
| **Limite** | Selon plan | 500/jour (gratuit) |
| **Configuration** | API Key Resend | App Password Gmail |
| **Restrictions** | Emails vérifiés | Aucune |
| **Code frontend** | ✅ Inchangé | ✅ Inchangé |
| **Logique auth** | ✅ Inchangée | ✅ Inchangée |
| **Format email** | ✅ Identique | ✅ Identique |

---

## 💡 Avantages

✅ **100% gratuit** (pas de carte bancaire)
✅ **Aucune restriction** d'email destinataire
✅ **Fiabilité Gmail** (excellente délivrabilité)
✅ **Code inchangé** (frontend et logique auth)
✅ **Setup en 3 minutes**
✅ **500 emails/jour** (largement suffisant)

---

## 📝 Code modifié

**Un seul fichier :**
- `supabase/functions/send-welcome-email/index.ts`

**Changements :**
- Import : `denomailer` au lieu de Resend API
- Variables : `SMTP_*` au lieu de `RESEND_API_KEY`
- Envoi : SMTP client au lieu de fetch vers API Resend

**Tout le reste est strictement identique ! 🎉**

---

## 🆘 Problème ?

### L'email n'arrive pas
1. Vérifiez les spams
2. Vérifiez que l'App Password est correct (pas votre mot de passe Gmail normal)
3. Vérifiez les logs : `supabase functions logs send-welcome-email`

### Erreur "SMTP credentials not configured"
→ Relancez : `supabase secrets set SMTP_USERNAME=...` et `SMTP_PASSWORD=...`

### Erreur "Authentication failed"
→ Créez un nouveau App Password Gmail sur https://myaccount.google.com/apppasswords

---

## 📚 Documentation complète

Voir `CONFIGURATION_SMTP_GRATUIT.md` pour plus de détails.

---

**C'est prêt ! Vous pouvez maintenant envoyer des emails gratuitement. 🚀**
