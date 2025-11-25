#!/bin/bash
# Script de déploiement automatique Ges-Cab
# Utilisation: ./deploy-production.sh GITHUB_USERNAME

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
GITHUB_USERNAME="${1:-gouzman}"  # Username GitHub (par défaut: gouzman)
REPO_NAME="gestion-cab"
SERVER_IP="82.25.116.122"
SERVER_USER="root"
APP_DIR="/var/www/apps/gescab-new"
OLD_FRONTEND="/var/www/Ges-Cab"
OLD_BACKEND="/var/www/GestionOp"

echo -e "${GREEN}🚀 Déploiement Ges-Cab en cours...${NC}"
echo -e "${YELLOW}Repo: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}${NC}"
echo ""

# ====================================
# ÉTAPE 1: Sauvegarde de l'ancien
# ====================================
echo -e "${YELLOW}📦 Étape 1/7: Sauvegarde de l'ancienne version...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
BACKUP_DIR="/var/www/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
echo "Sauvegarde dans: $BACKUP_DIR"

# Sauvegarder l'ancien frontend
if [ -d "/var/www/Ges-Cab" ]; then
  cp -r /var/www/Ges-Cab $BACKUP_DIR/
  echo "✅ Ancien frontend sauvegardé"
fi

# Sauvegarder l'ancien backend
if [ -d "/var/www/GestionOp" ]; then
  cp -r /var/www/GestionOp $BACKUP_DIR/
  echo "✅ Ancien backend sauvegardé"
fi

# Exporter la config PM2
/root/.volta/bin/pm2 save || true
cp /root/.pm2/dump.pm2 $BACKUP_DIR/ 2>/dev/null || true
echo "✅ Config PM2 sauvegardée"
EOF

echo -e "${GREEN}✅ Sauvegarde terminée${NC}"
echo ""

# ====================================
# ÉTAPE 2: Arrêter les anciens services
# ====================================
echo -e "${YELLOW}🛑 Étape 2/7: Arrêt des anciens services PM2...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
# Arrêter les anciennes apps PM2
/root/.volta/bin/pm2 stop gescab 2>/dev/null || echo "gescab déjà arrêté"
/root/.volta/bin/pm2 stop api-gescab 2>/dev/null || echo "api-gescab déjà arrêté"
/root/.volta/bin/pm2 delete gescab 2>/dev/null || echo "gescab déjà supprimé"
/root/.volta/bin/pm2 delete api-gescab 2>/dev/null || echo "api-gescab déjà supprimé"
/root/.volta/bin/pm2 save
echo "✅ Anciens services arrêtés"
EOF

echo -e "${GREEN}✅ Services arrêtés${NC}"
echo ""

# ====================================
# ÉTAPE 3: Cloner le nouveau code
# ====================================
echo -e "${YELLOW}📥 Étape 3/7: Clonage du nouveau code depuis GitHub...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
# Créer le dossier apps si nécessaire
mkdir -p /var/www/apps

# Supprimer l'ancien dossier gescab-new s'il existe
rm -rf ${APP_DIR}

# Cloner le repo
cd /var/www/apps
git clone https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git gescab-new
cd gescab-new

echo "✅ Code cloné depuis GitHub"
ls -la
EOF

echo -e "${GREEN}✅ Code transféré${NC}"
echo ""

# ====================================
# ÉTAPE 4: Configuration .env
# ====================================
echo -e "${YELLOW}⚙️  Étape 4/7: Configuration des variables d'environnement...${NC}"

# Lire le fichier .env.local pour récupérer les clés
if [ -f ".env.local" ]; then
  echo "Utilisation des clés Supabase depuis .env.local..."
  
  # Copier .env.local vers le serveur comme .env.production
  scp .env.local ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/.env.production
  
  echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
else
  echo -e "${RED}⚠️  Fichier .env.local introuvable !${NC}"
  echo "Création d'un fichier .env.production minimal..."
  
  ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cat > /var/www/apps/gescab-new/.env.production << 'ENVFILE'
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_SUPABASE_SERVICE_KEY=votre_service_key
NODE_ENV=production
ENVFILE
EOF
  
  echo -e "${YELLOW}⚠️  IMPORTANT: Éditez /var/www/apps/gescab-new/.env.production avec vos vraies clés !${NC}"
fi

echo ""

# ====================================
# ÉTAPE 5: Installation et Build
# ====================================
echo -e "${YELLOW}🔨 Étape 5/7: Installation des dépendances et build...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /var/www/apps/gescab-new

# Installer Node.js si nécessaire (via Volta)
if ! command -v node &> /dev/null; then
  echo "Installation de Node.js via Volta..."
  curl https://get.volta.sh | bash
  export VOLTA_HOME="$HOME/.volta"
  export PATH="$VOLTA_HOME/bin:$PATH"
  volta install node@22
fi

# Installer les dépendances
echo "Installation des dépendances..."
npm ci --production=false

# Build de l'application
echo "Build de l'application..."
npm run build

# Vérifier que le dossier dist existe
if [ -d "dist" ]; then
  echo "✅ Build réussi - dossier dist créé"
  ls -lh dist/
else
  echo "❌ Erreur: le dossier dist n'a pas été créé"
  exit 1
fi
EOF

echo -e "${GREEN}✅ Application buildée${NC}"
echo ""

# ====================================
# ÉTAPE 6: Configuration Nginx
# ====================================
echo -e "${YELLOW}🌐 Étape 6/7: Configuration de Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
# Créer la nouvelle configuration nginx
cat > /etc/nginx/sites-available/ges-cab.com << 'NGINX'
# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name ges-cab.com www.ges-cab.com;
    return 301 https://$host$request_uri;
}

# Site principal - Application Ges-Cab
server {
    listen 443 ssl http2;
    server_name ges-cab.com www.ges-cab.com;

    root /var/www/apps/gescab-new/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/ges-cab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ges-cab.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Configuration SPA - Toutes les routes pointent vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache agressif pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    access_log /var/log/nginx/gescab_access.log;
    error_log /var/log/nginx/gescab_error.log;
}
NGINX

# Activer le site (déjà fait mais on s'assure)
ln -sf /etc/nginx/sites-available/ges-cab.com /etc/nginx/sites-enabled/ges-cab.com

# Supprimer les anciens conflits
rm -f /etc/nginx/sites-enabled/api.ges-cab.com.conf 2>/dev/null || true

# Tester la configuration
echo "Test de la configuration nginx..."
nginx -t

if [ $? -eq 0 ]; then
  echo "✅ Configuration nginx valide"
  systemctl reload nginx
  echo "✅ Nginx rechargé"
else
  echo "❌ Erreur dans la configuration nginx"
  exit 1
fi
EOF

echo -e "${GREEN}✅ Nginx configuré et rechargé${NC}"
echo ""

# ====================================
# ÉTAPE 7: Nettoyage (optionnel)
# ====================================
echo -e "${YELLOW}🧹 Étape 7/7: Nettoyage des anciens fichiers...${NC}"
read -p "Voulez-vous supprimer les anciens dossiers ? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
  ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
echo "Suppression des anciens dossiers..."
rm -rf /var/www/Ges-Cab
rm -rf /var/www/GestionOp
echo "✅ Anciens dossiers supprimés"
EOF
else
  echo "⏭️  Anciens dossiers conservés (dans /var/www/Ges-Cab et /var/www/GestionOp)"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "🌐 Votre application est accessible sur:"
echo -e "${GREEN}   https://www.ges-cab.com${NC}"
echo -e "${GREEN}   https://ges-cab.com${NC}"
echo ""
echo -e "📊 Vérifications:"
echo "   - Testez l'application dans votre navigateur"
echo "   - Vérifiez la console pour les erreurs"
echo "   - Testez la connexion Supabase"
echo ""
echo -e "📝 Logs nginx:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/gescab_error.log'"
echo ""
