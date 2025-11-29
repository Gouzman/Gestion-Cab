# 📝 Documentation des Variables d'Environnement

**Projet** : Gestion-Cab  
**Dernière mise à jour** : 29 novembre 2025

---

## 🎯 Vue d'ensemble

Ce document décrit toutes les variables d'environnement utilisées dans le projet, leur usage, et les bonnes pratiques de sécurité associées.

---

## 🔐 Principes de sécurité

### Variables VITE_ (Exposées au client)
- ✅ **Toutes les variables préfixées par `VITE_`** sont compilées dans le bundle JavaScript
- ⚠️ **Ne JAMAIS** mettre de secrets, clés API privées, ou tokens dans les variables `VITE_`
- ✅ Exemples de ce qui peut être `VITE_` : URLs publiques, noms d'application, flags de fonctionnalités

### Variables sans préfixe (Serveur uniquement)
- ✅ **Variables sans `VITE_`** ne sont accessibles que côté serveur (Node.js, CI/CD)
- ✅ Utiliser pour : clés service_role, secrets SMTP, tokens d'API privés

---

## 📋 Variables par catégorie

### 🗄️ Supabase (OBLIGATOIRE)

| Variable | Type | Exposée client | Description |
|----------|------|----------------|-------------|
| `VITE_SUPABASE_URL` | URL | ✅ Oui | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | String | ✅ Oui | Clé anonyme publique (safe pour le client) |
| `SUPABASE_SERVICE_ROLE_KEY` | String | ❌ **NON** | Clé avec privilèges admin - **UNIQUEMENT CI/CD** |

**Où trouver ces valeurs :**
1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Settings > API
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public → `VITE_SUPABASE_ANON_KEY`
   - service_role (⚠️ secret) → `SUPABASE_SERVICE_ROLE_KEY`

---

### 🚀 Application

| Variable | Type | Exposée client | Défaut | Description |
|----------|------|----------------|--------|-------------|
| `NODE_ENV` | String | ❌ Non | `development` | Environnement d'exécution |
| `VITE_APP_NAME` | String | ✅ Oui | `"Gestion Cabinet"` | Nom de l'application |
| `VITE_APP_VERSION` | String | ✅ Oui | `1.0.0` | Version actuelle |

---

### 📄 Serveur PDF

| Variable | Type | Exposée client | Défaut | Description |
|----------|------|----------------|--------|-------------|
| `VITE_PDF_SERVICE_URL` | URL | ✅ Oui | `http://localhost:3001` | URL du service de normalisation PDF |
| `VITE_PRODUCTION_URL` | URL | ✅ Oui | - | URL de l'app en prod (pour CORS) |

**Configuration du serveur PDF :**
- En développement : `http://localhost:3001`
- En production : Déployer le serveur PDF et mettre l'URL ici

---

### 🔍 Monitoring & Erreurs

| Variable | Type | Exposée client | Optionnel | Description |
|----------|------|----------------|-----------|-------------|
| `VITE_SENTRY_DSN` | String | ✅ Oui | ✅ Oui | DSN Sentry pour tracking des erreurs |
| `VITE_SENTRY_ENVIRONMENT` | String | ✅ Oui | ✅ Oui | Environnement Sentry (prod/staging) |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Number | ✅ Oui | ✅ Oui | Taux d'échantillonnage (0.0 - 1.0) |

**Comment configurer Sentry :**
1. Créez un compte sur [sentry.io](https://sentry.io)
2. Créez un nouveau projet (React)
3. Copiez le DSN fourni
4. Définissez `VITE_SENTRY_DSN` avec ce DSN

---

### 📦 Limites & Quotas

| Variable | Type | Exposée client | Défaut | Description |
|----------|------|----------------|--------|-------------|
| `VITE_MAX_FILE_SIZE` | Number | ✅ Oui | `52428800` | Taille max fichier (bytes) - 50MB |
| `VITE_MAX_FILES_PER_UPLOAD` | Number | ✅ Oui | `10` | Nombre max fichiers par upload |

---

### 🔒 Sécurité

| Variable | Type | Exposée client | Défaut | Description |
|----------|------|----------------|--------|-------------|
| `VITE_RATE_LIMIT_WINDOW_MS` | Number | ✅ Oui | `900000` | Fenêtre rate limit (ms) - 15 min |
| `VITE_RATE_LIMIT_MAX_REQUESTS` | Number | ✅ Oui | `50` | Max requêtes par fenêtre |

**Note :** Le rate limiting est configuré côté serveur dans `server/index.js`

---

### ⚙️ Fonctionnalités

| Variable | Type | Exposée client | Défaut | Description |
|----------|------|----------------|--------|-------------|
| `VITE_ENABLE_PDF_NORMALIZATION` | Boolean | ✅ Oui | `true` | Activer normalisation PDF |
| `VITE_ENABLE_WORD_CONVERSION` | Boolean | ✅ Oui | `true` | Activer conversion Word→PDF |
| `VITE_ENABLE_ANALYTICS` | Boolean | ✅ Oui | `true` | Activer analytics |

---

## 🛠️ Configuration par environnement

### Développement local

Fichier : `.env.local`

```bash
NODE_ENV=development
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_PDF_SERVICE_URL=http://localhost:3001
```

### Production

Fichier : `.env.production` (⚠️ Ne jamais commiter ce fichier)

```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_PDF_SERVICE_URL=https://pdf-service.votre-domaine.com
VITE_PRODUCTION_URL=https://gestion-cab.votre-domaine.com
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
```

---

## 🔐 GitHub Actions / CI/CD

Pour les déploiements automatisés, configurer les secrets dans GitHub :

1. Allez sur votre repo GitHub
2. Settings > Secrets and variables > Actions
3. Cliquez sur "New repository secret"
4. Ajoutez :

| Secret Name | Valeur |
|-------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase |
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `VITE_SENTRY_DSN` | DSN Sentry (optionnel) |

**Exemple d'utilisation dans `.github/workflows/deploy.yml` :**

```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## ✅ Checklist de sécurité

Avant de déployer en production :

- [ ] `.env.production` n'est PAS dans Git
- [ ] `.env.production` est dans `.gitignore`
- [ ] Aucune clé `service_role` n'est dans une variable `VITE_`
- [ ] Tous les secrets sont dans GitHub Secrets (CI/CD)
- [ ] CORS configuré avec whitelist stricte en production
- [ ] Rate limiting activé sur les endpoints sensibles
- [ ] Sentry configuré pour le monitoring des erreurs
- [ ] Variables obsolètes supprimées (ex: `VITE_RESEND_*`)

---

## 🚨 Variables obsolètes (à supprimer)

Ces variables ne sont plus utilisées et doivent être retirées :

- ❌ `VITE_RESEND_API_KEY` → Remplacé par SMTP Gmail dans Edge Functions
- ❌ `TEMPLATE_BANNER_SCRIPT_URL` → Non utilisé
- ❌ `TEMPLATE_REDIRECT_URL` → Non utilisé
- ❌ `VITE_API_URL` (si inutilisé) → Vérifier usage avant suppression

---

## 📚 Ressources

- [Documentation Supabase API](https://supabase.com/docs/reference/javascript)
- [Documentation Vite sur les variables d'environnement](https://vitejs.dev/guide/env-and-mode.html)
- [Documentation Sentry JavaScript](https://docs.sentry.io/platforms/javascript/)
- [Guide sécurité GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Maintenu par** : GitHub Copilot (Claude Sonnet 4.5)  
**Date de création** : 29 novembre 2025
