#!/bin/bash
# 🔙 Rollback vers version précédente

set -e

# ========================================
# CONFIGURATION
# ========================================
SERVER_IP="82.25.116.122"
SERVER_USER="root"
APP_NAME="gestion-cab"

echo "============================================"
echo "🔙 ROLLBACK - ${APP_NAME}"
echo "============================================"
echo ""

# ========================================
# 1. LISTER LES BACKUPS DISPONIBLES
# ========================================
echo "📦 Backups disponibles :"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    BACKUP_DIR="/var/www/gestion-cab/backups"
    cd ${BACKUP_DIR} 2>/dev/null || { echo "❌ Aucun backup trouvé"; exit 1; }
    ls -lht backup_*.tar.gz 2>/dev/null || { echo "❌ Aucun backup trouvé"; exit 1; }
ENDSSH

echo ""
read -p "📝 Entrez le nom du backup à restaurer (ex: backup_20250116_123456.tar.gz) : " BACKUP_NAME

if [ -z "$BACKUP_NAME" ]; then
    echo "❌ Nom de backup requis"
    exit 1
fi

# ========================================
# 2. CONFIRMATION
# ========================================
echo ""
echo "⚠️  Vous allez restaurer : ${BACKUP_NAME}"
echo "   Cela va remplacer la version actuelle"
echo ""
read -p "Confirmer le rollback ? (yes/N) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ Rollback annulé"
    exit 1
fi

# ========================================
# 3. RESTAURATION
# ========================================
echo "🔄 Restauration en cours..."

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    set -e
    
    APP_NAME="gestion-cab"
    BACKUP_DIR="/var/www/\${APP_NAME}/backups"
    CURRENT_DIR="/var/www/\${APP_NAME}/dist"
    BACKUP_FILE="\${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Vérifier que le backup existe
    if [ ! -f "\${BACKUP_FILE}" ]; then
        echo "❌ Backup introuvable : \${BACKUP_FILE}"
        exit 1
    fi
    
    # Sauvegarder la version actuelle avant rollback
    EMERGENCY_BACKUP="\${BACKUP_DIR}/emergency_backup_\$(date +%Y%m%d_%H%M%S).tar.gz"
    if [ -d "\${CURRENT_DIR}" ] && [ "\$(ls -A \${CURRENT_DIR})" ]; then
        echo "💾 Sauvegarde d'urgence de la version actuelle..."
        tar -czf \${EMERGENCY_BACKUP} -C \${CURRENT_DIR} .
        echo "✅ Sauvegarde d'urgence créée"
    fi
    
    # Nettoyer le dossier actuel
    echo "🧹 Nettoyage du dossier actuel..."
    rm -rf \${CURRENT_DIR}/*
    
    # Extraire le backup
    echo "📦 Extraction du backup..."
    tar -xzf \${BACKUP_FILE} -C \${CURRENT_DIR}
    
    echo "✅ Backup restauré"
    
    # Recharger Nginx
    echo "🔄 Rechargement Nginx..."
    nginx -t && systemctl reload nginx
    
    echo "✅ Rollback terminé"
ENDSSH

# ========================================
# 4. HEALTH CHECK
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
# 5. SUCCÈS
# ========================================
echo ""
echo "============================================"
echo "✅ ROLLBACK TERMINÉ"
echo "============================================"
echo "🔙 Version restaurée : ${BACKUP_NAME}"
echo "🌐 URL : http://${SERVER_IP}"
echo ""
