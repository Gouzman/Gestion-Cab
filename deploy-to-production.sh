#!/bin/bash

# ============================================
# Script de déploiement en production
# ============================================

set -e  # Arrêter en cas d'erreur

echo "============================================"
echo "🚀 DÉPLOIEMENT EN PRODUCTION"
echo "============================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. Vérifications préliminaires
# ============================================
echo -e "${BLUE}📋 Étape 1 : Vérifications préliminaires${NC}"

if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Fichier .env introuvable${NC}"
  exit 1
fi

if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  Dossier dist/ introuvable, build en cours...${NC}"
  npm run build
fi

echo -e "${GREEN}✅ Vérifications OK${NC}"
echo ""

# ============================================
# 2. Informations du serveur
# ============================================
echo -e "${BLUE}📋 Étape 2 : Configuration du serveur${NC}"
echo ""

# À personnaliser selon votre serveur
read -p "Entrez l'adresse du serveur (ex: user@192.168.1.100): " SERVER_ADDRESS
read -p "Entrez le chemin de destination (ex: /var/www/gestion-cab): " DEST_PATH

echo ""
echo -e "${GREEN}✅ Configuration :${NC}"
echo "   Serveur : $SERVER_ADDRESS"
echo "   Destination : $DEST_PATH"
echo ""

# ============================================
# 3. Sauvegarde de la version actuelle
# ============================================
echo -e "${BLUE}📋 Étape 3 : Sauvegarde de la version actuelle${NC}"

read -p "Voulez-vous sauvegarder la version actuelle sur le serveur ? (o/n) : " BACKUP_CHOICE

if [ "$BACKUP_CHOICE" == "o" ] || [ "$BACKUP_CHOICE" == "O" ]; then
  BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
  echo "Création de la sauvegarde : $BACKUP_NAME"
  ssh $SERVER_ADDRESS "cd $DEST_PATH/.. && cp -r $(basename $DEST_PATH) $BACKUP_NAME" || echo -e "${YELLOW}⚠️  Pas de version existante à sauvegarder${NC}"
  echo -e "${GREEN}✅ Sauvegarde créée${NC}"
fi
echo ""

# ============================================
# 4. Copie des fichiers
# ============================================
echo -e "${BLUE}📋 Étape 4 : Copie des fichiers vers le serveur${NC}"

# Créer le dossier s'il n'existe pas
ssh $SERVER_ADDRESS "mkdir -p $DEST_PATH"

# Copier le contenu de dist/
echo "Transfert des fichiers..."
rsync -avz --delete dist/ $SERVER_ADDRESS:$DEST_PATH/

echo -e "${GREEN}✅ Fichiers copiés${NC}"
echo ""

# ============================================
# 5. Configuration nginx (optionnel)
# ============================================
echo -e "${BLUE}📋 Étape 5 : Configuration nginx${NC}"

read -p "Voulez-vous créer/mettre à jour la configuration nginx ? (o/n) : " NGINX_CHOICE

if [ "$NGINX_CHOICE" == "o" ] || [ "$NGINX_CHOICE" == "O" ]; then
  read -p "Entrez le nom de domaine (ex: cabinet.example.com): " DOMAIN_NAME
  
  # Créer le fichier de configuration nginx
  cat > /tmp/nginx-gestion-cab.conf << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    root $DEST_PATH;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css text/javascript application/javascript application/json;
    
    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing - toutes les requêtes vers index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

  # Copier et activer la config nginx
  scp /tmp/nginx-gestion-cab.conf $SERVER_ADDRESS:/tmp/nginx-gestion-cab.conf
  ssh $SERVER_ADDRESS "sudo mv /tmp/nginx-gestion-cab.conf /etc/nginx/sites-available/gestion-cab && \
                       sudo ln -sf /etc/nginx/sites-available/gestion-cab /etc/nginx/sites-enabled/gestion-cab && \
                       sudo nginx -t && \
                       sudo systemctl reload nginx"
  
  rm /tmp/nginx-gestion-cab.conf
  
  echo -e "${GREEN}✅ Configuration nginx mise à jour${NC}"
fi
echo ""

# ============================================
# 6. Permissions
# ============================================
echo -e "${BLUE}📋 Étape 6 : Configuration des permissions${NC}"

ssh $SERVER_ADDRESS "sudo chown -R www-data:www-data $DEST_PATH && \
                     sudo chmod -R 755 $DEST_PATH"

echo -e "${GREEN}✅ Permissions configurées${NC}"
echo ""

# ============================================
# 7. Test de l'application
# ============================================
echo -e "${BLUE}📋 Étape 7 : Test de l'application${NC}"

if [ ! -z "$DOMAIN_NAME" ]; then
  echo "Test de l'application sur http://$DOMAIN_NAME"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN_NAME || echo "000")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Application accessible (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${RED}⚠️  Application non accessible (HTTP $HTTP_CODE)${NC}"
    echo "Vérifiez la configuration nginx et les logs"
  fi
fi
echo ""

# ============================================
# 8. Résumé
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "============================================"
echo ""
echo "📦 Fichiers déployés dans : $DEST_PATH"
echo "🌐 URL : http://$DOMAIN_NAME"
echo ""
echo "Prochaines étapes :"
echo "  1. Tester l'application dans le navigateur"
echo "  2. Vérifier les logs nginx : sudo tail -f /var/log/nginx/error.log"
echo "  3. Configurer HTTPS avec certbot (recommandé)"
echo ""
echo "Pour HTTPS (Let's Encrypt) :"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN_NAME"
echo ""
echo -e "${GREEN}🎉 Déploiement réussi !${NC}"
echo ""
