#!/bin/bash
# 🌐 Installation configuration Nginx

echo "============================================"
echo "🌐 CONFIGURATION NGINX"
echo "============================================"
echo ""

APP_NAME="gestion-cab"
NGINX_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"

# ========================================
# 1. SAUVEGARDER CONFIG EXISTANTE (si existe)
# ========================================
if [ -f "${NGINX_AVAILABLE}" ]; then
    echo "💾 Sauvegarde de la config existante..."
    cp ${NGINX_AVAILABLE} ${NGINX_AVAILABLE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# ========================================
# 2. COPIER NOUVELLE CONFIG
# ========================================
echo "📝 Installation de la nouvelle config..."
# Cette commande sera exécutée après avoir copié le fichier nginx-config
# cp deployment/nginx-config ${NGINX_AVAILABLE}

# ========================================
# 3. CRÉER LIEN SYMBOLIQUE
# ========================================
echo "🔗 Activation du site..."
if [ ! -L "${NGINX_ENABLED}" ]; then
    ln -s ${NGINX_AVAILABLE} ${NGINX_ENABLED}
    echo "✅ Site activé"
else
    echo "✅ Site déjà activé"
fi

# ========================================
# 4. DÉSACTIVER SITE PAR DÉFAUT (optionnel)
# ========================================
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Site par défaut détecté"
    read -p "Désactiver le site par défaut ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm /etc/nginx/sites-enabled/default
        echo "✅ Site par défaut désactivé"
    fi
fi

# ========================================
# 5. TESTER LA CONFIG
# ========================================
echo "🧪 Test de la configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valide"
    echo ""
    read -p "Redémarrer Nginx ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl reload nginx
        echo "✅ Nginx rechargé"
    fi
else
    echo "❌ Configuration invalide"
    echo "Restaurer la sauvegarde si nécessaire"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ NGINX CONFIGURÉ"
echo "============================================"
