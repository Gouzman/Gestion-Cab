# 🚀 PLAN DE MIGRATION PRODUCTION

**Date** : 29 novembre 2025  
**Projet** : Gestion de Cabinet - SCPA KERE-ASSOCIES  
**Serveur** : 82.25.116.122 (root)  
**Objectif** : Déploiement production propre et sécurisé

---

## 📋 TABLE DES MATIÈRES

1. [Pré-requis](#1-pré-requis)
2. [Nettoyage du serveur](#2-nettoyage-du-serveur)
3. [Installation des dépendances](#3-installation-des-dépendances)
4. [Configuration environnement](#4-configuration-environnement)
5. [Déploiement frontend](#5-déploiement-frontend)
6. [Déploiement service PDF](#6-déploiement-service-pdf)
7. [Configuration Nginx](#7-configuration-nginx)
8. [Sécurisation SSL](#8-sécurisation-ssl)
9. [Protection RLS Supabase](#9-protection-rls-supabase)
10. [Tests de validation](#10-tests-de-validation)

---

## 🎯 OBJECTIFS FINAUX

- ✅ Application 100% fonctionnelle
- ✅ HTTPS activé (si domaine disponible)
- ✅ Services PM2 persistants
- ✅ Monitoring actif
- ✅ Backups automatiques
- ✅ 0 dette technique

---

## 1. PRÉ-REQUIS

### A. Informations Nécessaires

**Accès Serveur**
```bash
Serveur   : 82.25.116.122
Utilisateur : root
Clé SSH   : ~/.ssh/id_rsa (ou mot de passe)
```

**Supabase**
```bash
URL       : https://fhuzkubnxuetakpxkwlr.supabase.co
Anon Key  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (BACKEND UNIQUEMENT)
```

**Domaine (Optionnel pour HTTPS)**
```bash
Domaine   : votre-domaine.com (ou 82.25.116.122)
DNS A     : 82.25.116.122
```

### B. Outils Locaux Requis

```bash
# Vérifier les outils
node --version          # v20.x minimum
npm --version           # v10.x minimum
git --version           # 2.x minimum
ssh -V                  # OpenSSH_8.x minimum

# Si manquants, installer :
# macOS : brew install node git
```

### C. Vérifier Connexion SSH

```bash
# Test connexion
ssh root@82.25.116.122 "echo 'Connexion OK'"

# Si erreur, configurer clé SSH
ssh-keygen -t rsa -b 4096 -C "votre@email.com"
ssh-copy-id root@82.25.116.122
```

---

## 2. NETTOYAGE DU SERVEUR

### A. Diagnostic Initial

```bash
# Connexion au serveur
ssh root@82.25.116.122

# Exécuter diagnostic
cd /tmp
curl -O https://raw.githubusercontent.com/VOTRE_REPO/deployment/diagnostic.sh
bash diagnostic.sh > diagnostic_$(date +%Y%m%d).txt

# Examiner le résultat
cat diagnostic_*.txt
```

**⚠️ À noter** :
- Services en cours d'exécution
- Ports utilisés (surtout 80, 443, 3001)
- Espace disque disponible (minimum 5 GB)
- Processus Node.js ou Nginx existants

### B. Arrêter Services Existants (SI PRÉSENTS)

```bash
# Vérifier processus Node.js
ps aux | grep node

# Arrêter processus Node.js manuels
pkill -f "node server/index.js"
pkill -f "node.*pdf"

# Vérifier PM2
pm2 list

# Si PM2 existe avec anciens services
pm2 delete all
pm2 save --force

# Arrêter Nginx (temporairement)
systemctl stop nginx
```

### C. Nettoyer Anciens Déploiements

```bash
# Sauvegarder l'ancien /var/www si existe
if [ -d "/var/www/gestion-cab" ]; then
    BACKUP_OLD="/root/backup_old_deployment_$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_OLD
    cp -r /var/www/gestion-cab $BACKUP_OLD/
    echo "✅ Ancien déploiement sauvegardé dans $BACKUP_OLD"
fi

# Supprimer ancien contenu (après backup)
rm -rf /var/www/gestion-cab/*
# OU recréer proprement
rm -rf /var/www/gestion-cab
mkdir -p /var/www/gestion-cab/{dist,logs,backups,releases}
```

### D. Vérifier Espace Disque

```bash
# Vérifier espace disponible
df -h

# Nettoyer si nécessaire
apt-get clean
apt-get autoremove -y

# Supprimer anciens logs (optionnel)
find /var/log -type f -name "*.log" -mtime +30 -delete
```

---

## 3. INSTALLATION DES DÉPENDANCES

### A. Mise à Jour Système (Prudent)

```bash
# Ne pas faire d'upgrade complet pour ne rien casser
apt-get update -y

# Installer uniquement les paquets manquants
```

### B. Installer Node.js 20 LTS

```bash
# Vérifier si Node existe
node --version

# Si absent ou version < 20
if ! command -v node &> /dev/null || [ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]; then
    echo "📦 Installation Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js $(node --version) installé"
else
    echo "✅ Node.js $(node --version) déjà installé"
fi
```

### C. Installer PM2

```bash
# Installer PM2 globalement
npm install -g pm2

# Configurer démarrage automatique
pm2 startup systemd -u root --hp /root

# Vérifier installation
pm2 --version
```

### D. Installer Nginx

```bash
# Vérifier si Nginx existe
if ! command -v nginx &> /dev/null; then
    echo "📦 Installation Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    echo "✅ Nginx installé"
else
    echo "✅ Nginx déjà installé : $(nginx -v 2>&1)"
fi

# NE PAS démarrer Nginx maintenant (config plus tard)
```

### E. Installer Ghostscript & LibreOffice

```bash
# Pour le service PDF
apt-get install -y \
    ghostscript \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu

# Vérifier installations
gs --version
soffice --version
```

### F. Installer Certbot (HTTPS)

```bash
# Pour les certificats SSL
apt-get install -y certbot python3-certbot-nginx

# Vérifier installation
certbot --version
```

### G. Installer Utilitaires

```bash
# rsync pour déploiement, git pour référence
apt-get install -y rsync git curl wget

# Vérifier tout
echo "=== VERSIONS INSTALLÉES ==="
echo "Node.js  : $(node --version)"
echo "npm      : $(npm --version)"
echo "PM2      : $(pm2 --version)"
echo "Nginx    : $(nginx -v 2>&1)"
echo "Ghost.   : $(gs --version | head -1)"
echo "LibreO.  : $(soffice --version)"
echo "Certbot  : $(certbot --version | head -1)"
echo "rsync    : $(rsync --version | head -1)"
```

---

## 4. CONFIGURATION ENVIRONNEMENT

### A. Créer Structure Production

```bash
# Structure complète
mkdir -p /var/www/gestion-cab/{dist,logs,backups,releases,server}

# Permissions
chown -R www-data:www-data /var/www/gestion-cab/dist
chown -R root:root /var/www/gestion-cab/logs
chmod -R 755 /var/www/gestion-cab

# Vérifier
ls -la /var/www/gestion-cab/
```

### B. Configurer Variables d'Environnement Production

**Sur le serveur**, créer `.env.production` pour le service PDF :

```bash
# Créer fichier .env pour service PDF
cat > /var/www/gestion-cab/server/.env << 'EOF'
# ========================================
# PRODUCTION - SERVICE PDF
# ========================================
NODE_ENV=production
PORT=3001

# URL de l'application frontend (pour CORS)
VITE_PRODUCTION_URL=http://82.25.116.122

# Monitoring (optionnel)
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Limites
VITE_MAX_FILE_SIZE=52428800
EOF

# Permissions strictes
chmod 600 /var/www/gestion-cab/server/.env
chown root:root /var/www/gestion-cab/server/.env
```

**⚠️ IMPORTANT** : Les variables Supabase sont injectées au BUILD, pas sur le serveur.

### C. Créer Fichier .env.production LOCAL (pour build)

**Sur votre machine locale** :

```bash
cd /Users/gouzman/Documents/Gestion-Cab

# Créer .env.production (SI PAS DÉJÀ FAIT)
cat > .env.production << 'EOF'
# ========================================
# PRODUCTION BUILD VARIABLES
# ========================================

# Supabase
VITE_SUPABASE_URL=https://fhuzkubnxuetakpxkwlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXprdWJueHVldGFrcHhrd2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTE4MTEsImV4cCI6MjA3NDY4NzgxMX0.6_fLQrCtBdYAKNXgT2fAo6vHVfhe3DmISq7F-egfyUY

# Application
NODE_ENV=production
VITE_APP_NAME="Gestion Cabinet"
VITE_APP_VERSION=2.0.0

# Service PDF (URL où il sera accessible)
VITE_PDF_SERVICE_URL=http://82.25.116.122:3001

# Monitoring Sentry (optionnel mais recommandé)
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
# VITE_SENTRY_ENVIRONMENT=production
# VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Limites
VITE_MAX_FILE_SIZE=52428800
VITE_MAX_FILES_PER_UPLOAD=10

# Fonctionnalités
VITE_ENABLE_PDF_NORMALIZATION=true
VITE_ENABLE_WORD_CONVERSION=true
EOF

# Vérifier
cat .env.production
```

**⚠️ NE JAMAIS COMMITER `.env.production` dans Git !**

```bash
# Vérifier qu'il est dans .gitignore
grep "\.env\.production" .gitignore || echo ".env.production" >> .gitignore
```

---

## 5. DÉPLOIEMENT FRONTEND

### A. Build Local de Production

```bash
# Sur votre machine locale
cd /Users/gouzman/Documents/Gestion-Cab

# Installer dépendances si nécessaire
npm ci

# Build de production (utilise .env.production)
NODE_ENV=production npm run build

# Vérifier le build
ls -lh dist/
du -sh dist/
# Devrait montrer ~6-8 MB

# Vérifier que index.html existe
cat dist/index.html | head -20
```

### B. Transférer vers le Serveur

```bash
# rsync depuis votre machine locale
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.env*' \
    --exclude '*.map' \
    --progress \
    dist/ root@82.25.116.122:/var/www/gestion-cab/dist/

# Vérifier le transfert
ssh root@82.25.116.122 "ls -lh /var/www/gestion-cab/dist/ | head -20"
ssh root@82.25.116.122 "du -sh /var/www/gestion-cab/dist/"
```

### C. Vérifier Permissions

```bash
# Sur le serveur
ssh root@82.25.116.122 << 'EOF'
chown -R www-data:www-data /var/www/gestion-cab/dist
chmod -R 755 /var/www/gestion-cab/dist
ls -la /var/www/gestion-cab/dist/
EOF
```

---

## 6. DÉPLOIEMENT SERVICE PDF

### A. Transférer Code Serveur

```bash
# Depuis votre machine locale
cd /Users/gouzman/Documents/Gestion-Cab

# Transférer server/
rsync -avz \
    --exclude 'node_modules' \
    --exclude '*.log' \
    --exclude 'temp/*' \
    server/ root@82.25.116.122:/var/www/gestion-cab/server/

# Vérifier
ssh root@82.25.116.122 "ls -la /var/www/gestion-cab/server/"
```

### B. Installer Dépendances sur le Serveur

```bash
# Sur le serveur
ssh root@82.25.116.122 << 'EOF'
cd /var/www/gestion-cab/server
npm ci --only=production
ls -la node_modules/ | head -10
EOF
```

### C. Créer Dossier temp/

```bash
ssh root@82.25.116.122 << 'EOF'
mkdir -p /var/www/gestion-cab/server/temp
chmod 777 /var/www/gestion-cab/server/temp
EOF
```

### D. Configurer PM2

```bash
# Sur le serveur
ssh root@82.25.116.122 << 'EOF'
cd /var/www/gestion-cab/server

# Démarrer avec PM2
pm2 start index.js \
    --name pdf-service \
    --time \
    --max-memory-restart 500M \
    --env production

# Sauvegarder config PM2
pm2 save

# Vérifier status
pm2 list
pm2 info pdf-service

# Voir logs
pm2 logs pdf-service --lines 50
EOF
```

### E. Tester Service PDF

```bash
# Health check
ssh root@82.25.116.122 "curl -s http://localhost:3001/health | jq ."

# Devrait retourner :
# {
#   "status": "ok",
#   "ghostscript_version": "9.x.x",
#   "libreoffice_version": "LibreOffice 7.x.x",
#   "message": "Service opérationnel"
# }
```

**Si erreur** :
```bash
# Voir logs PM2
ssh root@82.25.116.122 "pm2 logs pdf-service --err --lines 100"

# Vérifier Ghostscript
ssh root@82.25.116.122 "gs --version"

# Vérifier LibreOffice
ssh root@82.25.116.122 "soffice --version"

# Redémarrer
ssh root@82.25.116.122 "pm2 restart pdf-service"
```

---

## 7. CONFIGURATION NGINX

### A. Copier Configuration Nginx

```bash
# Depuis votre machine locale
scp deployment/nginx-config root@82.25.116.122:/etc/nginx/sites-available/gestion-cab

# Vérifier
ssh root@82.25.116.122 "cat /etc/nginx/sites-available/gestion-cab"
```

### B. Activer Site

```bash
ssh root@82.25.116.122 << 'EOF'
# Créer lien symbolique
ln -sf /etc/nginx/sites-available/gestion-cab /etc/nginx/sites-enabled/gestion-cab

# Désactiver site par défaut (optionnel)
rm -f /etc/nginx/sites-enabled/default

# Tester configuration
nginx -t

# Si OK, recharger
systemctl reload nginx

# Vérifier status
systemctl status nginx
EOF
```

### C. Vérifier Configuration

```bash
# Tester depuis votre machine
curl -I http://82.25.116.122/

# Devrait retourner :
# HTTP/1.1 200 OK
# Content-Type: text/html
# X-Frame-Options: SAMEORIGIN
# ...
```

### D. Configuration Reverse Proxy pour Service PDF (Optionnel)

**SI vous voulez exposer le service PDF via Nginx** (non recommandé, préférer localhost uniquement) :

```bash
# Ajouter dans /etc/nginx/sites-available/gestion-cab

location /api/pdf/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # Timeout pour conversions longues
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    
    # Taille max upload
    client_max_body_size 50M;
}
```

**Note** : Par défaut, le service PDF reste sur localhost:3001 (plus sécurisé).

---

## 8. SÉCURISATION SSL

### A. Pré-requis : Nom de Domaine

**⚠️ HTTPS nécessite un nom de domaine.**

Si vous utilisez seulement l'IP `82.25.116.122`, **sautez cette section**.

**Si vous avez un domaine** :

1. Configurer DNS A Record : `votre-domaine.com` → `82.25.116.122`
2. Attendre propagation DNS (5-60 minutes)
3. Tester : `nslookup votre-domaine.com`

### B. Obtenir Certificat Let's Encrypt

```bash
# Sur le serveur (UNIQUEMENT SI DOMAINE CONFIGURÉ)
ssh root@82.25.116.122 << 'EOF'
# Remplacer par votre domaine
DOMAIN="votre-domaine.com"
EMAIL="admin@votre-domaine.com"

# Obtenir certificat
certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

# Vérifier certificat
certbot certificates

# Test renouvellement automatique
certbot renew --dry-run

# Activer timer de renouvellement
systemctl enable certbot.timer
systemctl start certbot.timer
EOF
```

**Résultat attendu** :
- ✅ Certificat SSL installé
- ✅ Redirection HTTP → HTTPS activée
- ✅ Renouvellement automatique configuré

### C. Tester HTTPS

```bash
# Depuis votre machine
curl -I https://votre-domaine.com/

# Devrait retourner :
# HTTP/2 200
# ...
```

### D. Mettre à Jour Frontend pour HTTPS

**Si HTTPS activé**, modifier `.env.production` local et rebuild :

```bash
# Sur votre machine
cd /Users/gouzman/Documents/Gestion-Cab

# Modifier .env.production
# VITE_PDF_SERVICE_URL=https://votre-domaine.com/api/pdf
# OU laisser http://82.25.116.122:3001 si pas de reverse proxy

# Rebuild
npm run build

# Re-déployer
rsync -avz --delete dist/ root@82.25.116.122:/var/www/gestion-cab/dist/
```

---

## 9. PROTECTION RLS SUPABASE

### A. Vérifier Policies RLS

```bash
# Se connecter à Supabase Dashboard
# https://supabase.com/dashboard/project/fhuzkubnxuetakpxkwlr

# Aller dans : Database > Tables > [table] > Policies
```

**Tables critiques à vérifier** :
- `profiles` : Seul l'utilisateur voit son propre profil
- `cases` : Filtré par `client_id` ou `visible_to`
- `tasks` : Filtré par permissions
- `documents` : Filtré par dossier

### B. Activer RLS sur Toutes les Tables

**Exécuter dans Supabase SQL Editor** :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Vérifier
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### C. Vérifier Policies Buckets Storage

**Dans Supabase Dashboard** : Storage > Policies

**Buckets** :
- `attachments` : Public read, authenticated write
- `task-scans` : Authenticated read/write

**Policies attendues** :

```sql
-- Pour attachments
CREATE POLICY "Public can read attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'attachments' 
    AND auth.role() = 'authenticated'
);

-- Idem pour task-scans (mais pas public)
```

### D. Supprimer Service Role Key du Frontend (SI PRÉSENTE)

**⚠️ CRITIQUE : La service_role key ne doit JAMAIS être dans le frontend.**

```bash
# Sur votre machine locale
cd /Users/gouzman/Documents/Gestion-Cab

# Vérifier si présente dans .env.production
grep "SERVICE_ROLE" .env.production

# Si présente : SUPPRIMER IMMÉDIATEMENT
sed -i '' '/VITE_SUPABASE_SERVICE_KEY/d' .env.production
sed -i '' '/SERVICE_ROLE/d' .env.production

# Rebuild
npm run build

# Re-déployer
rsync -avz --delete dist/ root@82.25.116.122:/var/www/gestion-cab/dist/
```

**La service_role key doit uniquement être** :
- Dans GitHub Secrets (CI/CD)
- Dans scripts backend (pas déployés)
- Jamais dans le code frontend

---

## 10. TESTS DE VALIDATION

### A. Tests Fonctionnels

**Depuis votre navigateur** : `http://82.25.116.122` (ou `https://votre-domaine.com`)

#### 1. Authentification
```
✓ Charger page login
✓ Se connecter avec admin
✓ Voir tableau de bord
✓ Se déconnecter
```

#### 2. Gestion Clients
```
✓ Créer un client test
✓ Modifier client
✓ Voir liste clients
✓ Filtrer clients
```

#### 3. Gestion Dossiers
```
✓ Créer dossier test
✓ Assigner à client
✓ Ajouter notes
✓ Modifier statut
```

#### 4. Upload Fichiers
```
✓ Upload PDF (< 1MB)
✓ Upload PDF (> 10MB)
✓ Upload Word (.docx)
✓ Upload image (.jpg)
✓ Vérifier preview
```

#### 5. Service PDF
```
✓ Upload PDF avec polices
✓ Vérifier normalisation (pas d'erreur TT undefined)
✓ Upload Word → conversion auto
✓ Preview Word converti
```

#### 6. Tâches
```
✓ Créer tâche
✓ Assigner à collaborateur
✓ Changer statut
✓ Ajouter fichier scanné
```

#### 7. Facturation
```
✓ Créer facture
✓ Ajouter lignes
✓ Imprimer facture (A4)
✓ Exporter PDF
```

### B. Tests Performance

```bash
# Depuis votre machine locale

# 1. Test temps de chargement
curl -o /dev/null -s -w "Time: %{time_total}s\n" http://82.25.116.122/

# Devrait être < 2s

# 2. Test taille page
curl -s http://82.25.116.122/ | wc -c

# Devrait être < 50KB (HTML)

# 3. Test health check service PDF
curl -s http://82.25.116.122:3001/health | jq .

# Devrait retourner status: ok
```

### C. Tests Sécurité

#### 1. Vérifier Headers HTTP
```bash
curl -I http://82.25.116.122/ | grep -E "X-Frame|X-Content|X-XSS"

# Devrait montrer :
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

#### 2. Tester Rate Limiting
```bash
# Envoyer 60 requêtes en 1 minute
for i in {1..60}; do
    curl -s http://82.25.116.122:3001/health > /dev/null
    echo "Request $i"
done

# Après 30-50 requêtes, devrait retourner 429 Too Many Requests
```

#### 3. Tester CORS
```bash
# Depuis un domaine non autorisé
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://82.25.116.122:3001/normalize-pdf

# Devrait bloquer (pas de Access-Control-Allow-Origin)
```

### D. Tests Monitoring

#### 1. Vérifier PM2
```bash
ssh root@82.25.116.122 "pm2 list"

# Devrait montrer :
# pdf-service | online | 0 restarts
```

#### 2. Vérifier Logs
```bash
# Logs Nginx
ssh root@82.25.116.122 "tail -20 /var/www/gestion-cab/logs/nginx-access.log"
ssh root@82.25.116.122 "tail -20 /var/www/gestion-cab/logs/nginx-error.log"

# Logs PM2
ssh root@82.25.116.122 "pm2 logs pdf-service --lines 20"
```

#### 3. Vérifier Espace Disque
```bash
ssh root@82.25.116.122 "df -h | grep -E 'Filesystem|/var'"

# /var doit avoir > 2 GB libre
```

### E. Tests Backup

```bash
# Vérifier backups automatiques
ssh root@82.25.116.122 "ls -lh /var/www/gestion-cab/backups/"

# Devrait montrer backups récents
```

---

## 🎯 COMMANDES FINALES DE VÉRIFICATION

### Checklist Complète

```bash
# Sur le serveur
ssh root@82.25.116.122 << 'EOF'
echo "=== VÉRIFICATION FINALE ==="
echo ""

echo "✓ Services"
systemctl is-active nginx && echo "  ✅ Nginx actif" || echo "  ❌ Nginx inactif"
pm2 list | grep -q "pdf-service.*online" && echo "  ✅ Service PDF actif" || echo "  ❌ Service PDF inactif"

echo ""
echo "✓ Fichiers"
[ -f /var/www/gestion-cab/dist/index.html ] && echo "  ✅ Frontend déployé" || echo "  ❌ Frontend manquant"
[ -f /var/www/gestion-cab/server/index.js ] && echo "  ✅ Backend présent" || echo "  ❌ Backend manquant"

echo ""
echo "✓ Dépendances"
gs --version > /dev/null 2>&1 && echo "  ✅ Ghostscript installé" || echo "  ❌ Ghostscript manquant"
soffice --version > /dev/null 2>&1 && echo "  ✅ LibreOffice installé" || echo "  ❌ LibreOffice manquant"

echo ""
echo "✓ Logs"
[ -f /var/www/gestion-cab/logs/nginx-access.log ] && echo "  ✅ Logs Nginx" || echo "  ❌ Logs Nginx absents"

echo ""
echo "✓ Health Checks"
curl -s http://localhost:3001/health > /dev/null && echo "  ✅ Service PDF répond" || echo "  ❌ Service PDF ne répond pas"

echo ""
echo "✓ Espace Disque"
df -h /var/www/gestion-cab | awk 'NR==2 {print "  💾 " $4 " disponible"}'

echo ""
echo "=== FIN VÉRIFICATION ==="
EOF
```

**Résultat attendu** : Tous les ✅

---

## 📝 COMMANDES UTILES POST-DÉPLOIEMENT

### Gestion Services

```bash
# Nginx
systemctl status nginx
systemctl restart nginx
systemctl reload nginx
nginx -t

# PM2
pm2 list
pm2 restart pdf-service
pm2 logs pdf-service
pm2 monit

# Voir tous les logs
pm2 logs --lines 100
```

### Monitoring

```bash
# Espace disque
df -h

# Processus
htop
ps aux | grep node

# Logs Nginx
tail -f /var/www/gestion-cab/logs/nginx-access.log
tail -f /var/www/gestion-cab/logs/nginx-error.log

# Health check
curl http://localhost:3001/health
```

### Backup Manuel

```bash
# Créer backup
cd /var/www/gestion-cab
tar -czf backups/manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz dist/

# Lister backups
ls -lh backups/
```

### Re-déploiement Rapide

```bash
# Depuis votre machine locale
cd /Users/gouzman/Documents/Gestion-Cab

# Rebuild
npm run build

# Re-déployer
rsync -avz --delete dist/ root@82.25.116.122:/var/www/gestion-cab/dist/

# Pas besoin de reload Nginx (fichiers statiques)
```

---

## 🚨 TROUBLESHOOTING

### Problème : Site ne charge pas

```bash
# 1. Vérifier Nginx
ssh root@82.25.116.122 "systemctl status nginx"
ssh root@82.25.116.122 "nginx -t"

# 2. Vérifier fichiers
ssh root@82.25.116.122 "ls -la /var/www/gestion-cab/dist/index.html"

# 3. Vérifier logs
ssh root@82.25.116.122 "tail -50 /var/www/gestion-cab/logs/nginx-error.log"

# 4. Vérifier permissions
ssh root@82.25.116.122 "namei -l /var/www/gestion-cab/dist/index.html"
```

### Problème : Service PDF ne fonctionne pas

```bash
# 1. Vérifier PM2
ssh root@82.25.116.122 "pm2 list"

# 2. Voir logs erreur
ssh root@82.25.116.122 "pm2 logs pdf-service --err --lines 50"

# 3. Vérifier Ghostscript
ssh root@82.25.116.122 "gs --version"

# 4. Redémarrer
ssh root@82.25.116.122 "pm2 restart pdf-service"

# 5. Vérifier health
ssh root@82.25.116.122 "curl http://localhost:3001/health"
```

### Problème : Erreurs CORS

```bash
# Vérifier variable VITE_PRODUCTION_URL
ssh root@82.25.116.122 "cat /var/www/gestion-cab/server/.env | grep PRODUCTION"

# Doit correspondre à l'URL frontend
# http://82.25.116.122 (ou https://votre-domaine.com)

# Redémarrer service
ssh root@82.25.116.122 "pm2 restart pdf-service"
```

### Problème : Upload fichiers échoue

```bash
# 1. Vérifier limite Nginx
ssh root@82.25.116.122 "grep client_max_body_size /etc/nginx/sites-available/gestion-cab"

# Doit être : client_max_body_size 50M;

# 2. Vérifier dossier temp/
ssh root@82.25.116.122 "ls -la /var/www/gestion-cab/server/temp/"
ssh root@82.25.116.122 "chmod 777 /var/www/gestion-cab/server/temp/"

# 3. Vérifier logs
ssh root@82.25.116.122 "pm2 logs pdf-service --lines 50"
```

---

## ✅ VALIDATION FINALE

### Checklist de Production

- [ ] Frontend accessible (http://82.25.116.122 ou https://domaine.com)
- [ ] Connexion admin fonctionne
- [ ] Upload PDF fonctionne
- [ ] Preview PDF fonctionne
- [ ] Conversion Word → PDF fonctionne
- [ ] Service PDF en PM2 (redémarrage auto)
- [ ] Nginx configuré et actif
- [ ] Logs accessibles
- [ ] Backups configurés
- [ ] Health checks OK
- [ ] RLS Supabase activé
- [ ] HTTPS activé (si domaine)
- [ ] Rate limiting actif
- [ ] CORS configuré

### Si Tous les ✅ : PRODUCTION OK 🎉

**Prochaine étape** : Créer `PRODUCTION_OK.md` avec tous les détails.

---

**📅 Plan créé le** : 29 novembre 2025  
**🎯 Objectif** : Déploiement production complet et sécurisé  
**⏱️ Durée estimée** : 60-90 minutes  
**📞 Support** : Voir TROUBLESHOOTING ci-dessus
