#!/bin/bash
# 🔧 Installation environnement production - SANS DOCKER
# À exécuter en tant que root sur le serveur

set -e  # Arrêter en cas d'erreur

echo "============================================"
echo "🚀 INSTALLATION ENVIRONNEMENT PRODUCTION"
echo "============================================"
echo ""

# ========================================
# 1. MISE À JOUR SYSTÈME (SANS CASSER)
# ========================================
echo "📦 Mise à jour des paquets..."
apt-get update -y
# Ne pas faire apt-get upgrade automatiquement pour ne rien casser

# ========================================
# 2. INSTALLATION NODE.JS 20 LTS
# ========================================
echo "📦 Installation Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js $(node --version) installé"
else
    echo "✅ Node.js déjà installé : $(node --version)"
fi

# ========================================
# 3. INSTALLATION PM2
# ========================================
echo "📦 Installation PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    echo "✅ PM2 installé"
else
    echo "✅ PM2 déjà installé : $(pm2 --version)"
fi

# ========================================
# 4. INSTALLATION NGINX
# ========================================
echo "📦 Installation Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx installé et démarré"
else
    echo "✅ Nginx déjà installé"
fi

# ========================================
# 5. INSTALLATION CERTBOT (HTTPS)
# ========================================
echo "📦 Installation Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
else
    echo "✅ Certbot déjà installé"
fi

# ========================================
# 6. INSTALLATION GIT (si absent)
# ========================================
echo "📦 Vérification Git..."
if ! command -v git &> /dev/null; then
    apt-get install -y git
    echo "✅ Git installé"
else
    echo "✅ Git déjà installé : $(git --version)"
fi

# ========================================
# 7. INSTALLATION RSYNC (pour déploiement)
# ========================================
echo "📦 Vérification rsync..."
if ! command -v rsync &> /dev/null; then
    apt-get install -y rsync
    echo "✅ rsync installé"
else
    echo "✅ rsync déjà installé"
fi

# ========================================
# 8. VÉRIFICATION FINALE
# ========================================
echo ""
echo "============================================"
echo "✅ INSTALLATION TERMINÉE"
echo "============================================"
echo ""
echo "Versions installées :"
echo "  Node.js  : $(node --version)"
echo "  npm      : $(npm --version)"
echo "  PM2      : $(pm2 --version)"
echo "  Nginx    : $(nginx -v 2>&1)"
echo "  Certbot  : $(certbot --version 2>&1 | head -1)"
echo "  Git      : $(git --version)"
echo "  rsync    : $(rsync --version | head -1)"
echo ""
