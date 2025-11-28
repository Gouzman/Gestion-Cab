# 🏢 Gestion de Cabinet - SCPA KERE-ASSOCIES

Application de gestion de cabinet d'avocats développée avec React, Vite et Supabase.

[![Word to PDF](https://img.shields.io/badge/Word→PDF-LibreOffice-blue?logo=libreoffice)](GUIDE_CONVERSION_WORD_PDF.md)
[![PDF Normalisation](https://img.shields.io/badge/PDF-Ghostscript%20Ready-green?logo=adobeacrobatreader)](SUMMARY_PDF.md)
[![Service Status](https://img.shields.io/badge/Service-Operational-success)](http://localhost:3001/health)

---

## 🆕 Dernières mises à jour

### ✅ Conversion Automatique Word → PDF (27 nov 2025)

Système automatique de conversion des documents Word en PDF pour permettre leur prévisualisation native dans l'application.

**👉 Démarrage rapide : [`QUICK_START_WORD_PDF.md`](QUICK_START_WORD_PDF.md)**  
**📋 Résumé : [`RESUME_CONVERSION_WORD_PDF.md`](RESUME_CONVERSION_WORD_PDF.md)**  
**📚 Documentation complète : [`GUIDE_CONVERSION_WORD_PDF.md`](GUIDE_CONVERSION_WORD_PDF.md)**

**Fonctionnalités :**
- ✅ Conversion automatique .doc/.docx → PDF (LibreOffice)
- ✅ Preview native des fichiers Word
- ✅ Plus jamais d'erreur "le preview ne supporte que les fichiers pdf"
- ✅ Aucune modification dans TaskManager.jsx

### ✅ Normalisation PDF avec Ghostscript (27 nov 2025)

Système automatique de normalisation des PDF avec Ghostscript pour éliminer les erreurs "TT undefined" dans PDF.js.

**👉 Démarrage rapide : [`QUICK_START_PDF.md`](QUICK_START_PDF.md)**  
**📋 Résumé : [`SUMMARY_PDF.md`](SUMMARY_PDF.md)**  
**📚 Documentation complète : [`GUIDE_NORMALISATION_PDF.md`](GUIDE_NORMALISATION_PDF.md)**

### ✅ Flux de Première Connexion (13 nov 2025)

Les collaborateurs peuvent maintenant créer leur propre mot de passe lors de leur première connexion, **sans envoi d'email**.

**👉 Commencez ici : [`GUIDE_PREMIERE_CONNEXION.md`](GUIDE_PREMIERE_CONNEXION.md)**

Documentation complète : [`FLUX_PREMIERE_CONNEXION.md`](FLUX_PREMIERE_CONNEXION.md)

### ✅ Migration SMTP Gratuit (13 nov 2025)

Remplacement de Resend (payant) par Gmail SMTP (gratuit).

**👉 Configuration : [`START_HERE_SMTP.md`](START_HERE_SMTP.md)**

Guide rapide : [`QUICK_START_SMTP_GRATUIT.md`](QUICK_START_SMTP_GRATUIT.md)

---

## 📋 Documentation par sujet

### 🔥 Première Connexion (nouveau)
- **[GUIDE_PREMIERE_CONNEXION.md](GUIDE_PREMIERE_CONNEXION.md)** - Guide utilisateur rapide
- **[FLUX_PREMIERE_CONNEXION.md](FLUX_PREMIERE_CONNEXION.md)** - Documentation technique
- **[setup-first-login-column.sql](setup-first-login-column.sql)** - Script SQL de configuration
- **[MISSION_ACCOMPLIE_PREMIERE_CONNEXION.md](MISSION_ACCOMPLIE_PREMIERE_CONNEXION.md)** - Résumé

### 🔥 Migration SMTP (nouveau)
- **[START_HERE_SMTP.md](START_HERE_SMTP.md)** - Point d'entrée principal
- **[QUICK_START_SMTP_GRATUIT.md](QUICK_START_SMTP_GRATUIT.md)** - Configuration en 3 minutes
- **[CONFIGURATION_SMTP_GRATUIT.md](CONFIGURATION_SMTP_GRATUIT.md)** - Guide complet
- **[COMMANDES_SMTP.md](COMMANDES_SMTP.md)** - Toutes les commandes utiles
- **[MISSION_ACCOMPLIE_SMTP_GRATUIT.md](MISSION_ACCOMPLIE_SMTP_GRATUIT.md)** - Résumé technique
- **[INDEX_FICHIERS_SMTP.md](INDEX_FICHIERS_SMTP.md)** - Index complet

### 🔥 Conversion Word → PDF (nouveau)
- **[QUICK_START_WORD_PDF.md](QUICK_START_WORD_PDF.md)** - Démarrage en 30 secondes 👈 **Commencez ici**
- **[RESUME_CONVERSION_WORD_PDF.md](RESUME_CONVERSION_WORD_PDF.md)** - Résumé technique
- **[GUIDE_CONVERSION_WORD_PDF.md](GUIDE_CONVERSION_WORD_PDF.md)** - Guide complet (installation, tests, diagnostic)
- **[INDEX_CONVERSION_WORD_PDF.md](INDEX_CONVERSION_WORD_PDF.md)** - Index de navigation

### 🔥 Normalisation PDF (nouveau)
- **[QUICK_START_PDF.md](QUICK_START_PDF.md)** - Démarrage en 3 commandes 👈 **Commencez ici**
- **[SUMMARY_PDF.md](SUMMARY_PDF.md)** - Résumé technique
- **[README_NORMALISATION_PDF.md](README_NORMALISATION_PDF.md)** - Installation complète
- **[GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md)** - Guide technique détaillé
- **[server/README.md](server/README.md)** - Documentation du service

### 🔐 Authentification
- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)
- [AUTHENTIFICATION_NOUVELLES_FONCTIONNALITES.md](AUTHENTIFICATION_NOUVELLES_FONCTIONNALITES.md)
- [GUIDE_PREMIERE_CONNEXION.md](GUIDE_PREMIERE_CONNEXION.md) 👈 **Nouveau**

### 📦 Stockage & Fichiers
- [BUCKET_AUTO_CREATION_GUIDE.md](BUCKET_AUTO_CREATION_GUIDE.md)
- [GUIDE_DEPLOIEMENT_FICHIERS_50MO.md](GUIDE_DEPLOIEMENT_FICHIERS_50MO.md)
- [FILE_BACKUP_SETUP_GUIDE.md](FILE_BACKUP_SETUP_GUIDE.md)
- [GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md) 👈 **Normalisation PDF**

### 🚀 Déploiement
- [DEPLOIEMENT_EDGE_FUNCTION.md](DEPLOIEMENT_EDGE_FUNCTION.md)
- [DEPLOYMENT_GUIDE_SCAN.md](DEPLOYMENT_GUIDE_SCAN.md)

### 🔒 Sécurité & Permissions
- [PERMISSIONS_SUMMARY.md](PERMISSIONS_SUMMARY.md)
- [PERMISSIONS_TEST_GUIDE.md](PERMISSIONS_TEST_GUIDE.md)

---

## 🚀 Démarrage rapide

### Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### Configuration email (nouvelle fonctionnalité)

```bash
# Exécuter le script automatique
./deploy-smtp-function.sh

# Ou voir START_HERE_SMTP.md pour plus de détails
```

### Lancement

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

---

## 🛠️ Technologies utilisées

- **Frontend** : React 18 + Vite
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage
- **Edge Functions** : Supabase Edge Functions (Deno)
- **Email** : SMTP Gmail (gratuit)
- **UI** : Lucide React Icons

---

## 📂 Structure du projet

```
Gestion-Cab/
├── src/
│   ├── components/          # Composants React
│   ├── lib/                 # Services et utilitaires
│   └── App.jsx              # Composant principal
│
├── supabase/
│   └── functions/
│       └── send-welcome-email/   # Edge Function envoi d'emails
│
├── public/                  # Assets statiques
│
└── [Documentation]/         # Guides et documentation
```

---

## ⚙️ Configuration requise

### Variables d'environnement (.env.local)

```bash
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_SUPABASE_SERVICE_KEY=votre_service_role_key
NODE_ENV=development
```

### Secrets Supabase (pour les emails)

```bash
SMTP_USERNAME=votre.email@gmail.com
SMTP_PASSWORD=votre_app_password_gmail
```

👉 Voir [QUICK_START_SMTP_GRATUIT.md](QUICK_START_SMTP_GRATUIT.md) pour la configuration complète

---

## 🧪 Tests

```bash
# Tester l'envoi d'email
npm run test:email

# Ou voir COMMANDES_SMTP.md pour plus de commandes
```

---

## 📚 Documentation complète

### Nouveautés (novembre 2025)
- ✅ Migration Resend → Gmail SMTP gratuit
- ✅ 0 changement dans le code frontend
- ✅ Configuration en 3 minutes
- ✅ 100% gratuit (500 emails/jour)

### Pour commencer
1. Lire [START_HERE_SMTP.md](START_HERE_SMTP.md)
2. Suivre [QUICK_START_SMTP_GRATUIT.md](QUICK_START_SMTP_GRATUIT.md)
3. Utiliser [COMMANDES_SMTP.md](COMMANDES_SMTP.md) comme référence

### Pour approfondir
- [CONFIGURATION_SMTP_GRATUIT.md](CONFIGURATION_SMTP_GRATUIT.md) - Alternatives SMTP
- [MISSION_ACCOMPLIE_SMTP_GRATUIT.md](MISSION_ACCOMPLIE_SMTP_GRATUIT.md) - Détails techniques

---

## 🆘 Support

### Problèmes d'email
→ Voir [CONFIGURATION_SMTP_GRATUIT.md](CONFIGURATION_SMTP_GRATUIT.md) (section Dépannage)

### Logs Supabase
```bash
supabase functions logs send-welcome-email
```

### Commandes utiles
→ Voir [COMMANDES_SMTP.md](COMMANDES_SMTP.md)

---

## 📊 Status du projet

| Fonctionnalité | Status |
|---------------|--------|
| Authentification | ✅ Opérationnel |
| Gestion utilisateurs | ✅ Opérationnel |
| Envoi d'emails | ✅ Opérationnel (SMTP gratuit) |
| Stockage fichiers | ✅ Opérationnel |
| Upload 50MB | ✅ Opérationnel |
| RLS Policies | ✅ Opérationnel |
| Scanner | ✅ Opérationnel |

---

## 🤝 Contribution

Ce projet est développé pour **SCPA KERE-ASSOCIES**.

Pour toute modification, consultez d'abord la documentation correspondante :
- Modifications d'email → [CONFIGURATION_SMTP_GRATUIT.md](CONFIGURATION_SMTP_GRATUIT.md)
- Modifications d'auth → [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)
- Modifications de stockage → [BUCKET_AUTO_CREATION_GUIDE.md](BUCKET_AUTO_CREATION_GUIDE.md)

---

## 📝 License

© 2025 SCPA KERE-ASSOCIES - Tous droits réservés

---

## 🔗 Liens utiles

- [Dashboard Supabase](https://app.supabase.com/project/fhuzkubnxuetakpxkwlr)
- [Documentation Supabase](https://supabase.com/docs)
- [App Password Gmail](https://myaccount.google.com/apppasswords)
- [Documentation Deno](https://deno.land/)

---

**Dernière mise à jour :** 13 novembre 2025  
**Version :** 2.0 (Migration SMTP)
