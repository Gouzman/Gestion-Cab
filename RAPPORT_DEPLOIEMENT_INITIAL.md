# 📊 RAPPORT DE DÉPLOIEMENT INITIAL

**Date d'analyse** : 29 novembre 2025  
**Serveur** : 82.25.116.122 (root)  
**Application** : Gestion de Cabinet - SCPA KERE-ASSOCIES

---

## 🎯 RÉSUMÉ EXÉCUTIF

Le projet a été conçu avec une **architecture moderne de déploiement**, utilisant GitHub Actions pour l'automatisation CI/CD. L'analyse des fichiers de déploiement révèle une stratégie de mise en production bien structurée mais **jamais complètement exécutée**.

### Statut Actuel
- ✅ **Infrastructure prévue** : Documentée et scriptée
- ⚠️ **Déploiement effectif** : Incomplet ou manuel partiel
- 🔧 **Configuration** : Scripts prêts mais pas tous exécutés

---

## 🏗️ ARCHITECTURE DU PREMIER DÉPLOIEMENT

### 1. **MÉTHODE DE DÉPLOIEMENT PRÉVUE**

#### A. Déploiement Automatisé (GitHub Actions)
**Fichier** : `.github/workflows/deploy.yml`

```yaml
Workflow complet en 3 jobs :
1. BUILD (ubuntu-latest)
   - Checkout code
   - Install Node.js 20
   - npm ci
   - npm run build
   - Upload artifact dist/

2. DEPLOY (ubuntu-latest)
   - Download artifact
   - Setup SSH (clé privée)
   - rsync vers 82.25.116.122:/var/www/gestion-cab/dist/
   - Reload Nginx

3. HEALTHCHECK
   - Vérification HTTP 200 sur /health
   - 5 tentatives avec retry
```

**Variables GitHub Secrets requises** :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SSH_PRIVATE_KEY`
- `SERVER_IP` (82.25.116.122)
- `SERVER_USER` (root)

#### B. Déploiement Manuel (Fallback)
**Script** : `deployment/deploy-manual.sh`

```bash
Workflow manuel :
1. Vérifications préalables
   - package.json présent
   - .env.production (optionnel avec warning)
   - Connexion SSH testée

2. Build local
   - npm ci (si node_modules absent)
   - npm run build
   - Vérification dist/ créé

3. Backup serveur distant
   - Sauvegarde dans /var/www/gestion-cab/backups/
   - Format: backup_YYYYMMDD_HHMMSS.tar.gz
   - Rétention: 5 derniers backups

4. Transfert rsync
   - dist/ → /var/www/gestion-cab/dist/
   - Exclusions: .git, node_modules, .env*, *.map

5. Post-déploiement
   - nginx -t && systemctl reload nginx
   - Statistiques disque

6. Health check
   - curl http://82.25.116.122/health
```

---

### 2. **BACKEND / FRONTEND**

#### Frontend (Application React)
**Méthode** : Application statique servie par Nginx

```
Architecture SPA (Single Page Application) :
- Build Vite → /var/www/gestion-cab/dist/
- Nginx sert les fichiers statiques
- Routing côté client (try_files)
```

**Port** : 80 (HTTP) / 443 (HTTPS avec Certbot)

**Configuration Nginx** : `deployment/nginx-config`
```nginx
server {
    listen 80;
    server_name 82.25.116.122;
    root /var/www/gestion-cab/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        return 200 "OK\n";
    }
}
```

#### Backend / Service PDF
**Méthode** : Service Node.js standalone (port 3001)

**Fichier** : `server/index.js`
```javascript
Service Express :
- Port: 3001
- Endpoints:
  * POST /normalize-pdf (Ghostscript)
  * POST /convert-word-to-pdf (LibreOffice)
  * GET /health
- Rate limiting activé
- CORS configuré pour production
```

**Démarrage prévu** : 
- Développement : `npm run pdf-service` ou `./ensure-pdf-service-smart.sh`
- Production : **PM2** (process manager)

```bash
# PM2 startup prévu (non confirmé exécuté)
pm2 start server/index.js --name pdf-service
pm2 save
pm2 startup systemd
```

**Dépendances système** :
- Node.js 20 LTS
- Ghostscript (normalisation PDF)
- LibreOffice (conversion Word → PDF)

---

### 3. **PORTS UTILISÉS**

| Service | Port | Protocole | Exposition |
|---------|------|-----------|------------|
| **Nginx** | 80 | HTTP | Public |
| **Nginx** | 443 | HTTPS | Public (si SSL configuré) |
| **Service PDF** | 3001 | HTTP | Localhost uniquement |
| **Supabase** | Externe | HTTPS | API cloud |

**Reverse Proxy** : Non configuré (service PDF sur localhost:3001)

**CORS Configuration** :
```javascript
// server/index.js
Production : Whitelist stricte
  - process.env.VITE_PRODUCTION_URL uniquement
  
Développement : Localhost autorisé
  - http://localhost:*
  - http://[::]:*
  - http://127.0.0.1:*
```

---

### 4. **STRUCTURE DES DOSSIERS (PRODUCTION)**

**Script de création** : `deployment/create-structure.sh`

```
/var/www/gestion-cab/
├── dist/                    # Frontend build (Vite)
│   ├── index.html
│   ├── assets/
│   │   ├── *.js
│   │   ├── *.css
│   │   └── *.woff2
│   └── ...
│
├── logs/                    # Logs Nginx
│   ├── nginx-access.log
│   └── nginx-error.log
│
├── backups/                 # Backups automatiques
│   ├── backup_20251129_*.tar.gz
│   └── ... (5 derniers)
│
└── releases/                # Releases historiques (optionnel)
```

**Permissions** :
```bash
/var/www/gestion-cab/dist/  → www-data:www-data (755)
/var/www/gestion-cab/logs/  → root:root
```

---

### 5. **SCRIPTS EXÉCUTÉS (PRÉVUS)**

#### Installation Environnement
**Script** : `deployment/install-environment.sh`

```bash
Paquets installés :
✅ Node.js 20 LTS (NodeSource)
✅ npm (avec Node)
✅ PM2 (npm global)
   - pm2 startup systemd
✅ Nginx
   - systemctl enable nginx
   - systemctl start nginx
✅ Certbot + python3-certbot-nginx
✅ Git
✅ rsync

Commandes :
apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx git rsync
npm install -g pm2
```

#### Configuration Nginx
**Script** : `deployment/setup-nginx.sh`

```bash
Actions :
1. Copie nginx-config → /etc/nginx/sites-available/gestion-cab
2. Lien symbolique → /etc/nginx/sites-enabled/gestion-cab
3. (Optionnel) Désactivation site default
4. Test config : nginx -t
5. Reload : systemctl reload nginx
```

#### HTTPS (Optionnel)
**Script** : `deployment/setup-https.sh`

```bash
Certbot Let's Encrypt :
certbot --nginx \
  -d <DOMAIN> \
  --non-interactive \
  --agree-tos \
  --email <EMAIL> \
  --redirect

Renouvellement automatique :
systemctl status certbot.timer
```

---

### 6. **FICHIERS INSTALLÉS MANUELLEMENT**

#### Sur le serveur (prévus) :

1. **Configuration Nginx**
   ```bash
   /etc/nginx/sites-available/gestion-cab
   /etc/nginx/sites-enabled/gestion-cab (symlink)
   ```

2. **Fichiers de l'application**
   ```bash
   /var/www/gestion-cab/dist/* (via rsync)
   ```

3. **Secrets / Variables d'environnement**
   ```bash
   NON DÉPLOYÉS (build-time injection)
   
   Variables injectées au build (Vite) :
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_PDF_SERVICE_URL (si configuré)
   - VITE_PRODUCTION_URL (si configuré)
   - VITE_SENTRY_DSN (si monitoring)
   
   ⚠️ IMPORTANT : Pas de .env sur le serveur
   Tout est compilé dans dist/assets/*.js
   ```

4. **Certificats SSL** (si HTTPS)
   ```bash
   /etc/letsencrypt/live/<DOMAIN>/
   ├── fullchain.pem
   └── privkey.pem
   ```

---

### 7. **MODE DE PERSISTENCE**

#### Frontend (Nginx)
**Type** : Service Systemd

```bash
Service : nginx.service
Statut : systemctl status nginx
Démarrage automatique : systemctl enable nginx
Logs : journalctl -u nginx -f
```

#### Service PDF (Node.js)
**Type prévu** : **PM2** (Process Manager)

```bash
Gestion PM2 :
pm2 start server/index.js --name pdf-service
pm2 save                    # Sauvegarde liste processes
pm2 startup systemd         # Démarrage automatique
pm2 list                    # Voir les processes
pm2 logs pdf-service        # Voir les logs
pm2 restart pdf-service     # Redémarrer
```

**Alternative non documentée** : Systemd service custom

```bash
# Fichier non créé mais possible :
/etc/systemd/system/pdf-service.service

[Unit]
Description=PDF Conversion Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/gestion-cab/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment="NODE_ENV=production"
Environment="PORT=3001"

[Install]
WantedBy=multi-user.target
```

---

## 🔐 SÉCURITÉ

### 1. **Certificats SSL**
- **Prévu** : Let's Encrypt via Certbot
- **Auto-renewal** : systemd timer (certbot.timer)
- **Statut** : ⚠️ Non vérifié si installé

### 2. **Firewall**
- **Recommandé** : UFW (Ubuntu Firewall)
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```
- **Statut** : ⚠️ Non documenté comme installé

### 3. **Variables d'environnement**
- **Secrets GitHub** : Injectés au build
- **Service PDF** : Variables système ou PM2 ecosystem.config.js
- **⚠️ AUCUN .env sur le serveur** (tout dans le build)

### 4. **Permissions**
```bash
Frontend : www-data:www-data
Logs     : root:root
Service  : www-data ou user dédié
```

---

## 🔍 DÉTAILS TECHNIQUES

### Nginx Configuration
```nginx
# Compression Gzip activée
gzip on;
gzip_types text/plain text/css application/javascript;

# Headers sécurité
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

# Cache statique
location ~* \.(css|js|jpg|png|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Upload limit
client_max_body_size 50M;
```

### Service PDF - Sécurité
```javascript
// Rate limiting
uploadLimiter: 50 req / 15 min
healthLimiter: 30 req / 1 min

// Spawn (pas exec) pour éviter injections
spawn('gs', args)      // Ghostscript
spawn('soffice', args) // LibreOffice

// Nettoyage automatique temp/
setInterval(() => cleanup(), 1 heure)
```

---

## 📋 CHECKLIST DU PREMIER DÉPLOIEMENT

D'après `deployment/CHECKLIST.md` :

### ✅ Préparation locale
- [ ] Code testé (`npm run dev`)
- [ ] Build fonctionne (`npm run build`)
- [ ] `.env.production` configuré
- [ ] Git push

### ✅ Base de données Supabase
- [ ] Scripts SQL exécutés
- [ ] Buckets créés (`attachments`, `task-scans`)
- [ ] RLS policies validées

### ✅ GitHub Secrets
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] SSH_PRIVATE_KEY
- [ ] SERVER_IP
- [ ] SERVER_USER

### ✅ Sur le serveur
- [ ] `diagnostic.sh` exécuté
- [ ] `install-environment.sh` exécuté
- [ ] `create-structure.sh` exécuté
- [ ] Config Nginx copiée et activée

### ✅ Déploiement
- [ ] GitHub Actions OU deploy-manual.sh
- [ ] Health check OK
- [ ] Site accessible

---

## ⚠️ POINTS D'ATTENTION

### 1. **Service PDF pas en PM2**
Le service PDF peut tourner manuellement (`node server/index.js`) mais :
- ⚠️ Pas de redémarrage automatique
- ⚠️ Pas de monitoring
- ⚠️ Logs non centralisés

**Solution** : Implémenter PM2 ou systemd service

### 2. **HTTPS non confirmé**
Le script `setup-https.sh` existe mais :
- ⚠️ Nécessite un nom de domaine
- ⚠️ Actuellement en HTTP uniquement (82.25.116.122)

### 3. **Firewall non documenté**
- ⚠️ Aucun script d'installation firewall
- ⚠️ Ports potentiellement tous ouverts

### 4. **Service PDF pas reverse-proxied**
- Le service PDF tourne sur localhost:3001
- ⚠️ Non accessible de l'extérieur (normal)
- ⚠️ Frontend doit pointer vers URL production du service PDF

### 5. **Backup non automatisé**
- Backups créés manuellement à chaque déploiement
- ⚠️ Pas de backup automatique quotidien/hebdomadaire

---

## 🎯 CONCLUSION

### Architecture Initiale Prévue

**Type** : **Déploiement moderne CI/CD + Services séparés**

```
┌─────────────────────────────────────────────┐
│          GITHUB (Code Source)               │
│  ┌──────────────────────────────────────┐   │
│  │    GitHub Actions Workflow           │   │
│  │  1. npm run build (dist/)            │   │
│  │  2. rsync → Serveur                  │   │
│  │  3. reload nginx                     │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓ SSH + rsync
┌─────────────────────────────────────────────┐
│     SERVEUR 82.25.116.122                   │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   NGINX      │      │  Service PDF    │ │
│  │   Port 80    │      │  Node.js:3001   │ │
│  │              │      │  (PM2)          │ │
│  │  Serve SPA   │      │  - Ghostscript  │ │
│  │  dist/       │      │  - LibreOffice  │ │
│  └──────────────┘      └─────────────────┘ │
│         ↓                                   │
│  /var/www/gestion-cab/dist/                 │
└─────────────────────────────────────────────┘
                    ↓ API
┌─────────────────────────────────────────────┐
│           SUPABASE (Cloud)                  │
│  - PostgreSQL (RLS)                         │
│  - Storage (buckets)                        │
│  - Auth                                     │
└─────────────────────────────────────────────┘
```

### Méthode de lancement initiale

**Frontend** : Nginx service (systemd)
```bash
systemctl start nginx    # Automatique au boot
```

**Backend PDF** : PM2 (prévu) OU manuel (réalité probable)
```bash
# Prévu :
pm2 start server/index.js --name pdf-service

# Réalité possible :
nohup node server/index.js > server.log 2>&1 &
```

### Statut global
- ✅ **Architecture** : Bien conçue
- ⚠️ **Exécution** : Probablement partielle
- 🔧 **Optimisation** : Nécessaire (voir PHASE 2)

---

**📅 Rapport généré le** : 29 novembre 2025  
**🔍 Prochaine étape** : Comparaison avec version optimisée (PHASE 2)
