# 🔙 PLAN DE RETOUR À L'ARCHITECTURE INITIALE

**Date** : 29 novembre 2025  
**Objectif** : Supprimer Docker et restaurer le mode de déploiement initial simple

---

## 📊 ÉTAT ACTUEL VS ÉTAT CIBLE

### État Actuel (à supprimer)
- ❌ Docker installé
- ❌ Containers/images Docker
- ❌ Dockerfile dans server/
- ❌ Services Docker systemd
- ❌ Configurations complexes

### État Cible (architecture initiale)
- ✅ Node.js direct (sans Docker)
- ✅ NGINX reverse proxy simple
- ✅ Structure `/var/www/ges-cab/`
- ✅ Service PDF accessible localement
- ✅ Frontend servi par NGINX

---

## 🎯 PLAN D'EXÉCUTION

### PHASE 1 : DIAGNOSTIC COMPLET
**Objectif** : Inventorier tout ce qui doit être supprimé

1. **Connexion au serveur**
   ```bash
   ssh root@82.25.116.122
   ```

2. **Lister services Docker**
   ```bash
   systemctl list-units --type=service --state=running | grep docker
   systemctl list-units --type=service | grep docker
   ```

3. **Lister containers et images**
   ```bash
   docker ps -a
   docker images
   docker volume ls
   docker network ls
   ```

4. **Vérifier l'architecture actuelle**
   ```bash
   ls -la /var/www/
   ls -la /var/www/ges-cab/ 2>/dev/null || echo "N'existe pas"
   ls -la /var/www/gestion-cab/ 2>/dev/null || echo "N'existe pas"
   ```

5. **Vérifier processus Node**
   ```bash
   ps aux | grep node | grep -v grep
   pm2 list 2>/dev/null || echo "PM2 non installé"
   ```

6. **Configuration NGINX actuelle**
   ```bash
   ls -la /etc/nginx/sites-enabled/
   cat /etc/nginx/sites-enabled/* 2>/dev/null
   ```

---

### PHASE 2 : SAUVEGARDE COMPLÈTE
**Objectif** : Sécuriser avant suppression

1. **Backup de la configuration actuelle**
   ```bash
   BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
   mkdir -p /root/backups/before_docker_removal_${BACKUP_DATE}
   
   # Sauvegarder configs NGINX
   cp -r /etc/nginx/sites-available /root/backups/before_docker_removal_${BACKUP_DATE}/
   cp -r /etc/nginx/sites-enabled /root/backups/before_docker_removal_${BACKUP_DATE}/
   
   # Sauvegarder dossier app si existe
   [ -d /var/www/ges-cab ] && tar -czf /root/backups/before_docker_removal_${BACKUP_DATE}/ges-cab.tar.gz /var/www/ges-cab
   [ -d /var/www/gestion-cab ] && tar -czf /root/backups/before_docker_removal_${BACKUP_DATE}/gestion-cab.tar.gz /var/www/gestion-cab
   
   # Liste des services systemd
   systemctl list-units --type=service > /root/backups/before_docker_removal_${BACKUP_DATE}/services.txt
   
   # Liste des containers/images Docker
   docker ps -a > /root/backups/before_docker_removal_${BACKUP_DATE}/docker_containers.txt 2>/dev/null || true
   docker images > /root/backups/before_docker_removal_${BACKUP_DATE}/docker_images.txt 2>/dev/null || true
   ```

2. **Export des containers importants (si données)**
   ```bash
   # Si un container a des données importantes
   # docker export <container_name> > /root/backups/container_export.tar
   ```

---

### PHASE 3 : ARRÊT ET SUPPRESSION DOCKER
**Objectif** : Nettoyer complètement Docker

1. **Arrêter tous les containers**
   ```bash
   docker stop $(docker ps -aq) 2>/dev/null || echo "Aucun container à arrêter"
   ```

2. **Supprimer tous les containers**
   ```bash
   docker rm $(docker ps -aq) 2>/dev/null || echo "Aucun container à supprimer"
   ```

3. **Supprimer toutes les images**
   ```bash
   docker rmi $(docker images -q) 2>/dev/null || echo "Aucune image à supprimer"
   ```

4. **Supprimer volumes et networks**
   ```bash
   docker volume prune -f
   docker network prune -f
   docker system prune -a -f --volumes
   ```

5. **Arrêter le service Docker**
   ```bash
   systemctl stop docker
   systemctl stop docker.socket
   systemctl disable docker
   systemctl disable docker.socket
   ```

6. **Désinstaller Docker complètement**
   ```bash
   apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   apt-get autoremove -y
   apt-get autoclean
   
   # Supprimer les dossiers Docker
   rm -rf /var/lib/docker
   rm -rf /var/lib/containerd
   rm -rf /etc/docker
   rm -rf ~/.docker
   ```

7. **Vérifier la suppression**
   ```bash
   docker --version 2>/dev/null && echo "⚠️ Docker encore présent" || echo "✅ Docker supprimé"
   systemctl status docker 2>/dev/null && echo "⚠️ Service encore actif" || echo "✅ Service supprimé"
   ```

---

### PHASE 4 : NETTOYAGE DES ARTEFACTS
**Objectif** : Supprimer fichiers de config Docker

1. **Supprimer Dockerfile local**
   ```bash
   # Sur la machine locale, pas sur le serveur
   # On garde une copie dans un dossier archive
   ```

2. **Nettoyer configurations systemd**
   ```bash
   # Sur le serveur
   rm -f /etc/systemd/system/docker-*
   systemctl daemon-reload
   ```

---

### PHASE 5 : RESTAURER ARCHITECTURE INITIALE
**Objectif** : Créer la structure simple et propre

1. **Créer la structure /var/www/ges-cab**
   ```bash
   mkdir -p /var/www/ges-cab/{frontend,server,pdf-server,logs}
   
   # Structure finale :
   # /var/www/ges-cab/
   # ├── frontend/      (build React/Vite)
   # ├── server/        (backend Node.js)
   # ├── pdf-server/    (service de conversion PDF)
   # ├── logs/          (logs applicatifs)
   # └── .env           (variables d'environnement)
   ```

2. **Définir les permissions**
   ```bash
   chown -R www-data:www-data /var/www/ges-cab
   chmod -R 755 /var/www/ges-cab
   chmod 644 /var/www/ges-cab/.env 2>/dev/null || true
   ```

---

### PHASE 6 : CONFIGURER NGINX SIMPLEMENT
**Objectif** : Reverse proxy minimal et fonctionnel

1. **Créer configuration NGINX**
   ```nginx
   # /etc/nginx/sites-available/ges-cab
   
   server {
       listen 80;
       server_name 82.25.116.122;
       
       # Logs
       access_log /var/www/ges-cab/logs/nginx-access.log;
       error_log /var/www/ges-cab/logs/nginx-error.log;
       
       # Frontend (SPA)
       root /var/www/ges-cab/frontend;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Backend Node.js (si nécessaire)
       location /api/ {
           proxy_pass http://localhost:3000/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Service PDF local
       location /pdf/ {
           proxy_pass http://localhost:3001/;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           client_max_body_size 50M;
       }
       
       # Health check
       location /health {
           return 200 "OK\n";
           add_header Content-Type text/plain;
       }
   }
   ```

2. **Activer la configuration**
   ```bash
   ln -sf /etc/nginx/sites-available/ges-cab /etc/nginx/sites-enabled/
   
   # Désactiver config par défaut si nécessaire
   rm -f /etc/nginx/sites-enabled/default
   rm -f /etc/nginx/sites-enabled/gestion-cab 2>/dev/null || true
   
   # Tester et recharger
   nginx -t
   systemctl reload nginx
   ```

---

### PHASE 7 : DÉPLOYER L'APPLICATION
**Objectif** : Installer le code et démarrer les services

1. **Depuis la machine locale : Build**
   ```bash
   cd /Users/gouzman/Documents/Gestion-Cab
   
   # Build frontend
   npm ci
   npm run build
   ```

2. **Transférer le frontend**
   ```bash
   rsync -avz --delete dist/ root@82.25.116.122:/var/www/ges-cab/frontend/
   ```

3. **Transférer le backend (si nécessaire)**
   ```bash
   rsync -avz --exclude node_modules server/ root@82.25.116.122:/var/www/ges-cab/server/
   ```

4. **Sur le serveur : Installer dépendances Node**
   ```bash
   cd /var/www/ges-cab/server
   npm ci --only=production
   ```

5. **Installer LibreOffice et Ghostscript (pour PDF)**
   ```bash
   apt-get update
   apt-get install -y libreoffice ghostscript
   ```

6. **Créer fichier .env**
   ```bash
   cat > /var/www/ges-cab/.env << 'EOF'
   NODE_ENV=production
   PORT=3001
   # Ajouter autres variables si nécessaire
   EOF
   
   chmod 600 /var/www/ges-cab/.env
   ```

---

### PHASE 8 : DÉMARRER LES SERVICES
**Objectif** : Lancer l'application sans Docker ni PM2

**Option 1 : Démarrage manuel (temporaire)**
```bash
cd /var/www/ges-cab/server
nohup node index.js > /var/www/ges-cab/logs/server.log 2>&1 &

# Noter le PID
echo $! > /var/run/ges-cab-server.pid
```

**Option 2 : Script de démarrage simple**
```bash
cat > /var/www/ges-cab/start.sh << 'EOF'
#!/bin/bash
cd /var/www/ges-cab/server
node index.js >> /var/www/ges-cab/logs/server.log 2>&1 &
echo $! > /var/run/ges-cab-server.pid
echo "✅ Serveur démarré (PID: $!)"
EOF

chmod +x /var/www/ges-cab/start.sh
```

**Option 3 : Service systemd simple (recommandé mais pas PM2)**
```bash
cat > /etc/systemd/system/ges-cab.service << 'EOF'
[Unit]
Description=Gestion Cabinet - Backend Node.js
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ges-cab/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/www/ges-cab/logs/server.log
StandardError=append:/var/www/ges-cab/logs/server-error.log
EnvironmentFile=/var/www/ges-cab/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ges-cab
systemctl start ges-cab
systemctl status ges-cab
```

---

### PHASE 9 : VÉRIFICATIONS FINALES
**Objectif** : S'assurer que tout fonctionne

1. **Vérifier NGINX**
   ```bash
   systemctl status nginx
   curl -I http://localhost/
   ```

2. **Vérifier service Node**
   ```bash
   systemctl status ges-cab  # Si systemd
   # OU
   ps aux | grep node | grep -v grep
   ```

3. **Vérifier logs**
   ```bash
   tail -f /var/www/ges-cab/logs/nginx-access.log
   tail -f /var/www/ges-cab/logs/server.log
   ```

4. **Test complet**
   ```bash
   # Health check
   curl http://82.25.116.122/health
   
   # Frontend
   curl http://82.25.116.122/
   
   # Backend (si exposé)
   curl http://82.25.116.122/api/health 2>/dev/null || echo "Pas d'API exposée"
   
   # Service PDF
   curl http://localhost:3001/health
   ```

5. **Test depuis navigateur externe**
   - Ouvrir http://82.25.116.122
   - Vérifier que l'application charge
   - Tester une fonctionnalité principale

---

## ⚠️ POINTS D'ATTENTION

### Avant suppression
- ✅ Sauvegarder TOUTES les configurations
- ✅ Noter les variables d'environnement utilisées
- ✅ Exporter les données si containers contiennent des données
- ✅ Documenter l'état actuel

### Pendant la transition
- ⚠️ L'application sera indisponible pendant 10-15 minutes
- ⚠️ Prévoir une fenêtre de maintenance
- ⚠️ Avertir les utilisateurs si nécessaire

### Après restauration
- ✅ Tester TOUTES les fonctionnalités
- ✅ Vérifier les logs pour erreurs
- ✅ Monitorer pendant 24h
- ✅ Documenter la nouvelle architecture

---

## 🚫 CE QUI NE SERA PAS FAIT

- ❌ **Pas de Docker** - Architecture totalement supprimée
- ❌ **Pas de PM2** (pour l'instant) - On peut l'ajouter plus tard si besoin
- ❌ **Pas de containers** - Tout en direct sur le système
- ❌ **Pas de orchestration** - Application monolithique simple

---

## ✅ ARCHITECTURE FINALE

```
┌─────────────────────────────────────────────────────────┐
│                   INTERNET                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              82.25.116.122:80                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              NGINX (Reverse Proxy)               │  │
│  │  - Serve frontend statique                       │  │
│  │  - Proxy /api → Node.js:3000 (si besoin)        │  │
│  │  - Proxy /pdf → PDF-server:3001                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  /var/www/ges-cab/                                      │
│  ├── frontend/         ← Build React/Vite              │
│  ├── server/           ← Backend Node.js (optionnel)   │
│  ├── pdf-server/       ← Service PDF (LibreOffice+GS) │
│  ├── logs/             ← Logs applicatifs              │
│  └── .env              ← Variables d'environnement     │
│                                                         │
│  Services actifs :                                      │
│  - nginx.service       (port 80)                        │
│  - ges-cab.service     (port 3001, systemd)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE (Cloud)                        │
│  - PostgreSQL + RLS                                     │
│  - Storage (buckets)                                    │
│  - Auth                                                 │
└─────────────────────────────────────────────────────────┘
```

### Caractéristiques
- **Simple** : Pas de couches d'abstraction inutiles
- **Direct** : Node.js tourne directement sur le système
- **Maintenable** : Architecture claire et compréhensible
- **Performant** : Pas d'overhead Docker
- **Léger** : Utilisation minimale des ressources

---

## 📝 COMMANDES RAPIDES

### Redémarrer l'application
```bash
systemctl restart ges-cab
systemctl reload nginx
```

### Voir les logs
```bash
journalctl -u ges-cab -f
tail -f /var/www/ges-cab/logs/server.log
```

### Déployer nouvelle version
```bash
# Local
npm run build
rsync -avz dist/ root@82.25.116.122:/var/www/ges-cab/frontend/

# Serveur (si backend changé)
systemctl restart ges-cab
```

---

**🎯 OBJECTIF ATTEINT** : Application fonctionnelle sans Docker, architecture simple et maintenable.
