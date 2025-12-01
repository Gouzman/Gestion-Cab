#!/bin/bash

# Script de déploiement complet avec installation du service PDF
# Corrige l'erreur 500 sur /pdf/health

set -e

echo "🚀 Déploiement complet avec service PDF"
echo "========================================"

# 1. Déployer le frontend
echo ""
echo "📦 1/4 - Déploiement du frontend..."
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
echo "✅ Frontend déployé"

# 2. Créer le dossier pdf-service et déployer les fichiers
echo ""
echo "📁 2/4 - Création de la structure du service PDF..."
ssh root@82.25.116.122 << 'ENDSSH'
# Créer le dossier si nécessaire
mkdir -p /var/www/Ges-Cab/pdf-service/temp

# Vérifier les permissions
chown -R root:root /var/www/Ges-Cab/pdf-service
chmod 755 /var/www/Ges-Cab/pdf-service
ENDSSH

echo "✅ Structure créée"

# 3. Déployer les fichiers du service
echo ""
echo "📄 3/4 - Déploiement des fichiers du service PDF..."
scp server/index.js root@82.25.116.122:/var/www/Ges-Cab/pdf-service/
scp server/package.json root@82.25.116.122:/var/www/Ges-Cab/pdf-service/
echo "✅ Fichiers déployés"

# 4. Installer et démarrer le service
echo ""
echo "🔧 4/4 - Installation et démarrage du service..."
ssh root@82.25.116.122 << 'ENDSSH'
cd /var/www/Ges-Cab/pdf-service

# Installer les dépendances si package-lock.json n'existe pas
if [ ! -f "package-lock.json" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Installer Ghostscript et LibreOffice si nécessaires
echo "Vérification des dépendances système..."
if ! command -v gs &> /dev/null; then
    echo "Installation de Ghostscript..."
    apt-get update && apt-get install -y ghostscript
fi

if ! command -v soffice &> /dev/null; then
    echo "Installation de LibreOffice..."
    apt-get update && apt-get install -y libreoffice-writer libreoffice-core
fi

# Arrêter le service existant si présent
if pm2 list | grep -q "pdf-service"; then
    echo "Arrêt du service existant..."
    pm2 stop pdf-service
    pm2 delete pdf-service
fi

# Démarrer avec PM2
echo "Démarrage du service PDF..."
NODE_ENV=production pm2 start index.js --name pdf-service --time
pm2 save

# Vérifier le statut
echo ""
echo "📊 Statut du service:"
pm2 list

# Test health check (attendre 3 secondes que le service démarre)
echo ""
echo "🏥 Test du health check..."
sleep 3
curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/health

# Vérifier les versions
echo ""
echo "✅ Versions installées:"
gs --version 2>/dev/null | head -1 || echo "⚠️ Ghostscript non trouvé"
soffice --version 2>/dev/null || echo "⚠️ LibreOffice non trouvé"

ENDSSH

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "🔍 Vérifications à effectuer:"
echo "   1. Tester: https://www.ges-cab.com/pdf/health"
echo "   2. L'alerte PDF ne devrait plus apparaître"
echo "   3. Les conversions Word→PDF et normalisation PDF fonctionnent"
echo ""
echo "📝 Configuration Nginx requise:"
echo "   Ajouter dans /etc/nginx/sites-available/ges-cab.com:"
echo ""
echo "   location /pdf/ {"
echo "       proxy_pass http://localhost:3001/;"
echo "       proxy_http_version 1.1;"
echo "       proxy_set_header Upgrade \$http_upgrade;"
echo "       proxy_set_header Connection 'upgrade';"
echo "       proxy_set_header Host \$host;"
echo "       proxy_cache_bypass \$http_upgrade;"
echo "       proxy_set_header X-Real-IP \$remote_addr;"
echo "       proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "       proxy_set_header X-Forwarded-Proto \$scheme;"
echo "       client_max_body_size 50M;"
echo "   }"
echo ""
echo "   Puis: sudo nginx -t && sudo systemctl reload nginx"
