#!/bin/bash
# 🚀 Déploiement manuel depuis la machine locale

set -e

# ========================================
# CONFIGURATION
# ========================================
SERVER_IP="82.25.116.122"
SERVER_USER="root"
APP_NAME="gestion-cab"
REMOTE_PATH="/var/www/${APP_NAME}/dist"

echo "============================================"
echo "🚀 DÉPLOIEMENT MANUEL - ${APP_NAME}"
echo "============================================"
echo ""

# ========================================
# 1. VÉRIFICATIONS
# ========================================
echo "🔍 Vérifications préalables..."

if [ ! -f "package.json" ]; then
    echo "❌ Erreur : package.json introuvable"
    echo "   Exécutez ce script depuis la racine du projet"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "⚠️  Avertissement : .env.production introuvable"
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Test connexion SSH
echo "🔐 Test de connexion SSH..."
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo '✅ Connexion OK'"; then
    echo "❌ Impossible de se connecter au serveur"
    exit 1
fi

# ========================================
# 2. BUILD LOCAL
# ========================================
echo ""
echo "🏗️  Build de l'application..."

# Installer dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm ci
fi

# Build production
echo "🔨 Compilation..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erreur : le dossier dist n'a pas été créé"
    exit 1
fi

echo "✅ Build terminé"

# ========================================
# 3. BACKUP DISTANT
# ========================================
echo ""
echo "💾 Sauvegarde de la version actuelle sur le serveur..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    APP_NAME="gestion-cab"
    BACKUP_DIR="/var/www/${APP_NAME}/backups"
    CURRENT_DIR="/var/www/${APP_NAME}/dist"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p ${BACKUP_DIR}
    
    if [ -d "${CURRENT_DIR}" ] && [ "$(ls -A ${CURRENT_DIR})" ]; then
        echo "📦 Sauvegarde en cours..."
        tar -czf ${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz -C ${CURRENT_DIR} .
        echo "✅ Backup créé : backup_${TIMESTAMP}.tar.gz"
        
        # Garder seulement les 5 derniers backups
        cd ${BACKUP_DIR}
        ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm
        echo "🧹 Anciens backups nettoyés (gardé les 5 derniers)"
    else
        echo "ℹ️  Pas de version actuelle à sauvegarder"
    fi
ENDSSH

# ========================================
# 4. DÉPLOIEMENT
# ========================================
echo ""
echo "📤 Déploiement vers le serveur..."

rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.env*' \
    --exclude '*.map' \
    --progress \
    dist/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

echo "✅ Fichiers transférés"

# ========================================
# 5. POST-DÉPLOIEMENT
# ========================================
echo ""
echo "🔄 Actions post-déploiement..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "🔄 Rechargement Nginx..."
    nginx -t && systemctl reload nginx
    echo "✅ Nginx rechargé"
    
    echo ""
    echo "📊 Statistiques :"
    du -sh /var/www/gestion-cab/dist
    ls -lh /var/www/gestion-cab/dist | head -10
ENDSSH

# ========================================
# 6. HEALTH CHECK
# ========================================
echo ""
echo "🏥 Health check..."

sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server is healthy (HTTP $HTTP_CODE)"
else
    echo "⚠️  Server returned HTTP $HTTP_CODE"
fi

# ========================================
# 7. SUCCÈS
# ========================================
echo ""
echo "============================================"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "============================================"
echo "🌐 URL : http://${SERVER_IP}"
echo "📅 Date : $(date)"
echo ""
echo "💡 Prochaines étapes :"
echo "   - Vérifier le site dans le navigateur"
echo "   - Tester les fonctionnalités principales"
echo "   - Configurer HTTPS si pas encore fait"
echo ""
