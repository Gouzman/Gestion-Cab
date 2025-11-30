#!/bin/bash
# 🔙 Script de retour à l'architecture initiale
# Supprime Docker et restaure le déploiement simple

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${SERVER_IP:-82.25.116.122}"
SERVER_USER="${SERVER_USER:-root}"
APP_NAME="ges-cab"
REMOTE_PATH="/var/www/${APP_NAME}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔙 RETOUR À L'ARCHITECTURE INITIALE${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ========================================
# FONCTION : Exécuter commande sur serveur
# ========================================
remote_exec() {
    ssh ${SERVER_USER}@${SERVER_IP} "$1"
}

# ========================================
# FONCTION : Confirmation
# ========================================
confirm() {
    local prompt="$1"
    local default="${2:-N}"
    
    if [ "$default" = "Y" ]; then
        prompt="$prompt [Y/n] "
    else
        prompt="$prompt [y/N] "
    fi
    
    read -p "$prompt" -r
    echo
    
    if [ "$default" = "Y" ]; then
        [[ $REPLY =~ ^[Nn]$ ]] && return 1 || return 0
    else
        [[ $REPLY =~ ^[Yy]$ ]] && return 0 || return 1
    fi
}

# ========================================
# PHASE 0 : AVERTISSEMENT
# ========================================
echo -e "${YELLOW}⚠️  AVERTISSEMENT${NC}"
echo "Ce script va :"
echo "  1. Supprimer Docker complètement"
echo "  2. Supprimer tous les containers et images"
echo "  3. Restaurer une architecture simple sans Docker"
echo "  4. L'application sera indisponible pendant 10-15 minutes"
echo ""

if ! confirm "Voulez-vous continuer ?" "N"; then
    echo -e "${RED}❌ Opération annulée${NC}"
    exit 1
fi

# ========================================
# PHASE 1 : TEST CONNEXION
# ========================================
echo -e "${BLUE}🔐 Test de connexion SSH...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo '✅ Connexion OK'"; then
    echo -e "${RED}❌ Impossible de se connecter au serveur${NC}"
    exit 1
fi

# ========================================
# PHASE 2 : DIAGNOSTIC
# ========================================
echo ""
echo -e "${BLUE}🔍 Diagnostic de l'état actuel...${NC}"

remote_exec "cat > /tmp/diagnostic.sh << 'EOFDIAG'
#!/bin/bash
echo '=== SERVICES DOCKER ==='
systemctl list-units --type=service | grep -i docker || echo 'Aucun service Docker'
echo ''

echo '=== CONTAINERS ==='
docker ps -a 2>/dev/null || echo 'Docker non accessible'
echo ''

echo '=== IMAGES DOCKER ==='
docker images 2>/dev/null || echo 'Aucune image'
echo ''

echo '=== STRUCTURE ACTUELLE ==='
ls -la /var/www/ 2>/dev/null || echo 'Dossier /var/www inexistant'
echo ''

echo '=== PROCESSUS NODE ==='
ps aux | grep -E 'node|npm' | grep -v grep || echo 'Aucun processus Node'
echo ''

echo '=== NGINX ==='
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo 'Pas de config NGINX'
EOFDIAG
chmod +x /tmp/diagnostic.sh
/tmp/diagnostic.sh
rm /tmp/diagnostic.sh
"

echo ""
if ! confirm "Le diagnostic ci-dessus est-il correct ? Continuer ?" "Y"; then
    echo -e "${RED}❌ Opération annulée${NC}"
    exit 1
fi

# ========================================
# PHASE 3 : SAUVEGARDE
# ========================================
echo ""
echo -e "${BLUE}💾 Création de sauvegardes...${NC}"

remote_exec "
set -e
BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=\"/root/backups/before_docker_removal_\${BACKUP_DATE}\"

mkdir -p \"\${BACKUP_DIR}\"

echo '📦 Sauvegarde des configurations...'

# Configs NGINX
if [ -d /etc/nginx/sites-available ]; then
    cp -r /etc/nginx/sites-available \"\${BACKUP_DIR}/\"
fi

if [ -d /etc/nginx/sites-enabled ]; then
    cp -r /etc/nginx/sites-enabled \"\${BACKUP_DIR}/\"
fi

# Dossiers app
if [ -d /var/www/ges-cab ]; then
    tar -czf \"\${BACKUP_DIR}/ges-cab.tar.gz\" /var/www/ges-cab 2>/dev/null || true
fi

if [ -d /var/www/gestion-cab ]; then
    tar -czf \"\${BACKUP_DIR}/gestion-cab.tar.gz\" /var/www/gestion-cab 2>/dev/null || true
fi

# Services systemd
systemctl list-units --type=service > \"\${BACKUP_DIR}/services.txt\"

# Docker info
docker ps -a > \"\${BACKUP_DIR}/docker_containers.txt\" 2>/dev/null || true
docker images > \"\${BACKUP_DIR}/docker_images.txt\" 2>/dev/null || true

echo \"✅ Sauvegardes créées dans \${BACKUP_DIR}\"
ls -lh \"\${BACKUP_DIR}/\"
"

echo -e "${GREEN}✅ Sauvegardes terminées${NC}"

# ========================================
# PHASE 4 : SUPPRESSION DOCKER
# ========================================
echo ""
echo -e "${BLUE}🗑️  Suppression de Docker...${NC}"

if ! confirm "⚠️  Confirmer la suppression de Docker et tous ses containers ?" "N"; then
    echo -e "${RED}❌ Opération annulée${NC}"
    exit 1
fi

remote_exec "
set -e

echo '🛑 Arrêt des containers...'
docker stop \$(docker ps -aq) 2>/dev/null || echo 'Aucun container à arrêter'

echo '🗑️  Suppression des containers...'
docker rm \$(docker ps -aq) 2>/dev/null || echo 'Aucun container à supprimer'

echo '🗑️  Suppression des images...'
docker rmi \$(docker images -q) 2>/dev/null || echo 'Aucune image à supprimer'

echo '🗑️  Nettoyage système Docker...'
docker volume prune -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true
docker system prune -a -f --volumes 2>/dev/null || true

echo '🛑 Arrêt des services Docker...'
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true
systemctl disable docker 2>/dev/null || true
systemctl disable docker.socket 2>/dev/null || true

echo '📦 Désinstallation des paquets Docker...'
apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
apt-get autoremove -y
apt-get autoclean

echo '🗑️  Suppression des dossiers Docker...'
rm -rf /var/lib/docker
rm -rf /var/lib/containerd
rm -rf /etc/docker
rm -rf ~/.docker

echo '✅ Docker complètement supprimé'

# Vérification
if command -v docker &> /dev/null; then
    echo '⚠️  Docker encore présent'
    exit 1
else
    echo '✅ Vérification : Docker bien supprimé'
fi
"

echo -e "${GREEN}✅ Docker supprimé avec succès${NC}"

# ========================================
# PHASE 5 : CRÉATION STRUCTURE
# ========================================
echo ""
echo -e "${BLUE}📁 Création de la nouvelle structure...${NC}"

remote_exec "
set -e

echo '📁 Création de /var/www/${APP_NAME}...'

# Nettoyer si existe déjà
if [ -d ${REMOTE_PATH} ]; then
    echo '⚠️  ${REMOTE_PATH} existe déjà, sauvegarde...'
    mv ${REMOTE_PATH} ${REMOTE_PATH}.old.\$(date +%Y%m%d_%H%M%S)
fi

# Créer structure
mkdir -p ${REMOTE_PATH}/{frontend,server,pdf-server,logs,backups}

# Permissions
chown -R www-data:www-data ${REMOTE_PATH}
chmod -R 755 ${REMOTE_PATH}

echo '✅ Structure créée :'
tree -L 2 ${REMOTE_PATH} 2>/dev/null || ls -la ${REMOTE_PATH}
"

echo -e "${GREEN}✅ Structure créée${NC}"

# ========================================
# PHASE 6 : CONFIGURATION NGINX
# ========================================
echo ""
echo -e "${BLUE}⚙️  Configuration NGINX...${NC}"

remote_exec "
set -e

cat > /etc/nginx/sites-available/${APP_NAME} << 'EOFNGINX'
server {
    listen 80;
    server_name ${SERVER_IP};
    
    # Logs
    access_log ${REMOTE_PATH}/logs/nginx-access.log;
    error_log ${REMOTE_PATH}/logs/nginx-error.log;
    
    # Frontend (SPA)
    root ${REMOTE_PATH}/frontend;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Service PDF local
    location /pdf/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        client_max_body_size 50M;
    }
    
    # Health check
    location /health {
        return 200 'OK\n';
        add_header Content-Type text/plain;
    }
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    
    # Cache statique
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control 'public, immutable';
    }
}
EOFNGINX

# Activer le site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Désactiver les anciennes configs
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/gestion-cab 2>/dev/null || true

# Tester config
echo '🔍 Test configuration NGINX...'
nginx -t

# Recharger
echo '🔄 Rechargement NGINX...'
systemctl reload nginx

echo '✅ NGINX configuré'
"

echo -e "${GREEN}✅ NGINX configuré${NC}"

# ========================================
# PHASE 7 : INSTALLATION DÉPENDANCES
# ========================================
echo ""
echo -e "${BLUE}📦 Installation des dépendances système...${NC}"

remote_exec "
set -e

echo '📦 Installation LibreOffice et Ghostscript...'
apt-get update -qq
apt-get install -y libreoffice ghostscript fonts-liberation fonts-dejavu

echo '✅ Dépendances installées'

# Vérifier installations
libreoffice --version
gs --version
"

echo -e "${GREEN}✅ Dépendances installées${NC}"

# ========================================
# PHASE 8 : DÉPLOIEMENT APPLICATION
# ========================================
echo ""
echo -e "${BLUE}🚀 Déploiement de l'application...${NC}"

echo "📦 Build de l'application en local..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur : Exécutez ce script depuis la racine du projet${NC}"
    exit 1
fi

# Build frontend
if [ ! -d "node_modules" ]; then
    npm ci
fi

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur : Build échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé${NC}"

# Transfert frontend
echo "📤 Transfert du frontend..."
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend/

echo -e "${GREEN}✅ Frontend transféré${NC}"

# Transfert serveur PDF
echo "📤 Transfert du serveur PDF..."
rsync -avz --exclude node_modules server/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/server/

# Installation dépendances Node sur serveur
echo "📦 Installation dépendances Node.js..."
remote_exec "
cd ${REMOTE_PATH}/server
npm ci --only=production
"

echo -e "${GREEN}✅ Serveur PDF transféré et configuré${NC}"

# ========================================
# PHASE 9 : CONFIGURATION SERVICE
# ========================================
echo ""
echo -e "${BLUE}⚙️  Configuration du service systemd...${NC}"

remote_exec "
set -e

cat > /etc/systemd/system/${APP_NAME}.service << 'EOFSERVICE'
[Unit]
Description=Gestion Cabinet - Backend et Service PDF
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${REMOTE_PATH}/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:${REMOTE_PATH}/logs/server.log
StandardError=append:${REMOTE_PATH}/logs/server-error.log
Environment=\"NODE_ENV=production\"
Environment=\"PORT=3001\"

[Install]
WantedBy=multi-user.target
EOFSERVICE

# Recharger systemd
systemctl daemon-reload

# Activer et démarrer
systemctl enable ${APP_NAME}
systemctl start ${APP_NAME}

echo '✅ Service configuré et démarré'
sleep 2
systemctl status ${APP_NAME} --no-pager
"

echo -e "${GREEN}✅ Service configuré${NC}"

# ========================================
# PHASE 10 : VÉRIFICATIONS FINALES
# ========================================
echo ""
echo -e "${BLUE}🏥 Vérifications finales...${NC}"

echo "1. Vérification NGINX..."
remote_exec "systemctl status nginx --no-pager | head -10"

echo ""
echo "2. Vérification service application..."
remote_exec "systemctl status ${APP_NAME} --no-pager | head -10"

echo ""
echo "3. Test health check..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check retourné HTTP $HTTP_CODE${NC}"
fi

echo ""
echo "4. Test frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend retourné HTTP $HTTP_CODE${NC}"
fi

echo ""
echo "5. Logs récents..."
remote_exec "tail -n 20 ${REMOTE_PATH}/logs/server.log 2>/dev/null || echo 'Pas de logs serveur'"

# ========================================
# SUCCÈS
# ========================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ MIGRATION TERMINÉE AVEC SUCCÈS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}🎯 Architecture restaurée :${NC}"
echo "   - ❌ Docker : Complètement supprimé"
echo "   - ✅ NGINX : Configuré et actif"
echo "   - ✅ Service Node.js : Actif (systemd)"
echo "   - ✅ Frontend : Déployé"
echo "   - ✅ Structure : ${REMOTE_PATH}"
echo ""
echo -e "${BLUE}🌐 URL de l'application :${NC} http://${SERVER_IP}"
echo ""
echo -e "${BLUE}📝 Commandes utiles :${NC}"
echo "   Redémarrer app    : systemctl restart ${APP_NAME}"
echo "   Voir logs         : journalctl -u ${APP_NAME} -f"
echo "   Voir logs détail  : tail -f ${REMOTE_PATH}/logs/server.log"
echo "   Redémarrer NGINX  : systemctl reload nginx"
echo ""
echo -e "${BLUE}💡 Prochaines étapes :${NC}"
echo "   1. Tester l'application dans le navigateur"
echo "   2. Vérifier toutes les fonctionnalités"
echo "   3. Monitorer les logs pendant quelques heures"
echo ""
echo -e "${GREEN}✨ Déploiement simple sans Docker activé !${NC}"
echo ""
