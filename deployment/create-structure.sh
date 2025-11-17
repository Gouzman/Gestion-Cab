#!/bin/bash
# 📁 Création structure production - SANS MODIFIER L'EXISTANT

echo "============================================"
echo "📁 CRÉATION STRUCTURE PRODUCTION"
echo "============================================"
echo ""

APP_NAME="gestion-cab"
BASE_DIR="/var/www/${APP_NAME}"

# ========================================
# 1. CRÉER DOSSIERS (sans écraser)
# ========================================
echo "📂 Création des dossiers..."

mkdir -p ${BASE_DIR}/dist
mkdir -p ${BASE_DIR}/logs
mkdir -p ${BASE_DIR}/backups
mkdir -p ${BASE_DIR}/releases

echo "✅ Structure créée dans ${BASE_DIR}"

# ========================================
# 2. PERMISSIONS
# ========================================
echo "🔐 Configuration des permissions..."

chown -R www-data:www-data ${BASE_DIR}/dist
chown -R root:root ${BASE_DIR}/logs
chmod -R 755 ${BASE_DIR}

echo "✅ Permissions configurées"

# ========================================
# 3. AFFICHER STRUCTURE
# ========================================
echo ""
echo "📋 Structure finale :"
tree -L 2 ${BASE_DIR} 2>/dev/null || ls -la ${BASE_DIR}

echo ""
echo "============================================"
echo "✅ STRUCTURE PRÊTE"
echo "============================================"
echo "Chemin de déploiement : ${BASE_DIR}"
