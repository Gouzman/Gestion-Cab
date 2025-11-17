# 🚀 Commandes Rapides - SMTP Gmail Gratuit

## 📋 Configuration initiale (une seule fois)

### 1. Obtenir App Password Gmail
```
👉 https://myaccount.google.com/apppasswords
```

### 2. Configurer les secrets Supabase
```bash
supabase secrets set SMTP_USERNAME=votre.email@gmail.com
supabase secrets set SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### 3. Déployer la fonction
```bash
supabase functions deploy send-welcome-email
```

## 🔧 Script automatique (recommandé)
```bash
cd /Users/gouzman/Documents/Gestion-Cab
./deploy-smtp-function.sh
```

---

## 🧪 Tests et vérifications

### Vérifier les secrets configurés
```bash
supabase secrets list
```

### Voir les logs de la fonction
```bash
supabase functions logs send-welcome-email
```

### Voir les logs en temps réel
```bash
supabase functions logs send-welcome-email --follow
```

### Test manuel via curl
```bash
curl -X POST https://fhuzkubnxuetakpxkwlr.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXprdWJueHVldGFrcHhrd2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTE4MTEsImV4cCI6MjA3NDY4NzgxMX0.6_fLQrCtBdYAKNXgT2fAo6vHVfhe3DmISq7F-egfyUY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Utilisateur Test"
  }'
```

---

## 🔄 Redéploiement (après modification)

### Redéployer la fonction
```bash
supabase functions deploy send-welcome-email
```

### Supprimer et redéployer (clean deploy)
```bash
supabase functions delete send-welcome-email
supabase functions deploy send-welcome-email
```

---

## 🔐 Gestion des secrets

### Lister tous les secrets
```bash
supabase secrets list
```

### Modifier un secret
```bash
supabase secrets set SMTP_USERNAME=nouveau.email@gmail.com
```

### Supprimer un secret
```bash
supabase secrets unset SMTP_USERNAME
```

---

## 📊 Surveillance

### Voir les invocations récentes
```bash
supabase functions logs send-welcome-email --limit 50
```

### Filtrer les erreurs
```bash
supabase functions logs send-welcome-email | grep ERROR
```

### Voir uniquement les succès
```bash
supabase functions logs send-welcome-email | grep success
```

---

## 🆘 Dépannage rapide

### Fonction non déployée
```bash
supabase functions list
```

### Vérifier la connexion Supabase
```bash
supabase status
```

### Se reconnecter
```bash
supabase login
```

### Vérifier le projet actif
```bash
supabase projects list
supabase link --project-ref fhuzkubnxuetakpxkwlr
```

---

## 📦 Commandes de développement local

### Lancer la fonction localement (nécessite Deno)
```bash
cd supabase/functions/send-welcome-email
deno run --allow-net --allow-env index.ts
```

### Servir toutes les fonctions en local
```bash
supabase functions serve
```

### Tester en local
```bash
curl -X POST http://localhost:54321/functions/v1/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
```

---

## 🔄 Alternatives SMTP (changement rapide)

### Passer à Outlook
```bash
supabase secrets set SMTP_HOSTNAME=smtp-mail.outlook.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=votre.email@outlook.com
supabase secrets set SMTP_PASSWORD=votre_mot_de_passe
supabase functions deploy send-welcome-email
```

### Passer à Mailjet
```bash
supabase secrets set SMTP_HOSTNAME=in-v3.mailjet.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=votre_api_key
supabase secrets set SMTP_PASSWORD=votre_secret_key
supabase functions deploy send-welcome-email
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `QUICK_START_SMTP_GRATUIT.md` | Guide de démarrage rapide (3 min) |
| `CONFIGURATION_SMTP_GRATUIT.md` | Configuration complète + alternatives |
| `MISSION_ACCOMPLIE_SMTP_GRATUIT.md` | Résumé des modifications |
| `supabase/functions/send-welcome-email/README.md` | Doc technique de la fonction |

---

## ✅ Checklist finale

- [ ] App Password Gmail créé
- [ ] `SMTP_USERNAME` configuré
- [ ] `SMTP_PASSWORD` configuré
- [ ] Fonction déployée : `supabase functions deploy send-welcome-email`
- [ ] Test manuel réussi (curl)
- [ ] Test depuis l'application réussi (créer un utilisateur)
- [ ] Email reçu avec mot de passe

---

**Dernière mise à jour :** 13 novembre 2025  
**Projet :** Gestion de Cabinet - SCPA KERE-ASSOCIES
