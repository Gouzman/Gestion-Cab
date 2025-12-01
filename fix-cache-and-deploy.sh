#!/bin/bash

# Script de vérification et correction finale pour l'erreur PDF 500
# Force le rechargement du cache navigateur

set -e

echo "🔍 VÉRIFICATION ET CORRECTION FINALE"
echo "===================================="
echo ""

# 1. Vérifier que le service PDF fonctionne
echo "1️⃣ Test du service PDF..."
HEALTH_STATUS=$(curl -s https://www.ges-cab.com/pdf/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "ok" ]; then
    echo "   ✅ Service PDF: OK"
else
    echo "   ❌ Service PDF: ERREUR - Status: $HEALTH_STATUS"
    echo ""
    echo "   Tentative de redémarrage..."
    ssh root@82.25.116.122 "pm2 restart pdf-service"
    sleep 3
    HEALTH_STATUS=$(curl -s https://www.ges-cab.com/pdf/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Nouveau status: $HEALTH_STATUS"
fi

echo ""

# 2. Déployer le nouveau build
echo "2️⃣ Déploiement du frontend..."
scp -q -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
echo "   ✅ Frontend déployé"

echo ""

# 3. Vider le cache sur le serveur
echo "3️⃣ Nettoyage du cache serveur..."
ssh root@82.25.116.122 << 'ENDSSH'
# Vider le cache Nginx si présent
if [ -d "/var/cache/nginx" ]; then
    rm -rf /var/cache/nginx/*
    echo "   ✅ Cache Nginx vidé"
fi

# Recharger Nginx
systemctl reload nginx
echo "   ✅ Nginx rechargé"

# Vérifier PM2
if pm2 list | grep -q "pdf-service.*online"; then
    echo "   ✅ Service PDF online"
else
    echo "   ⚠️ Redémarrage du service PDF..."
    pm2 restart pdf-service
fi
ENDSSH

echo ""

# 4. Test final
echo "4️⃣ Test final de l'endpoint..."
sleep 2
FINAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://www.ges-cab.com/pdf/health)
if [ "$FINAL_TEST" = "200" ]; then
    echo "   ✅ Endpoint répond avec 200 OK"
else
    echo "   ❌ Endpoint répond avec $FINAL_TEST"
fi

echo ""
echo "=================================="
echo "✅ CORRECTION TERMINÉE"
echo ""
echo "📋 ACTIONS À FAIRE MAINTENANT:"
echo ""
echo "1. Dans votre navigateur, faites un hard refresh:"
echo "   • Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
echo "   • Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
echo "   • Safari: Cmd+Option+R (Mac)"
echo ""
echo "2. Ou videz complètement le cache:"
echo "   • Chrome: Settings → Privacy → Clear browsing data"
echo "   • Firefox: Options → Privacy → Clear Data"
echo "   • Safari: Develop → Empty Caches"
echo ""
echo "3. Puis rechargez https://www.ges-cab.com"
echo ""
echo "4. Vérifiez dans la console (F12) qu'il n'y a plus d'erreur 500"
echo ""
echo "💡 Si l'erreur persiste après le hard refresh:"
echo "   - Ouvrez la console (F12)"
echo "   - Allez dans l'onglet Network"
echo "   - Cherchez la requête vers /pdf/health"
echo "   - Vérifiez le code de réponse"
echo ""
