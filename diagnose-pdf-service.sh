#!/bin/bash

# Script de diagnostic du service PDF
# Vérifie l'état du service sur le serveur de production

set -e

SERVER="root@82.25.116.122"
PDF_SERVICE_DIR="/var/www/Ges-Cab/pdf-service"

echo "🔍 Diagnostic du service PDF sur www.ges-cab.com"
echo "================================================"
echo ""

# 1. Vérifier si le service répond localement
echo "1️⃣ Test de l'endpoint /pdf/health depuis le web..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.ges-cab.com/pdf/health 2>/dev/null || echo "000")
echo "   Code HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Service répond avec succès"
    curl -s https://www.ges-cab.com/pdf/health | python3 -m json.tool 2>/dev/null || curl -s https://www.ges-cab.com/pdf/health
elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ❌ Erreur 500 - Le serveur a un problème interne"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "   ❌ Erreur 502 - Nginx ne peut pas joindre le service"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Impossible de joindre le serveur"
else
    echo "   ⚠️ Code inattendu: $HTTP_CODE"
fi

echo ""
echo "2️⃣ Connexion au serveur pour diagnostic détaillé..."

ssh $SERVER << 'ENDSSH'
echo ""
echo "📦 État du service PM2..."
pm2 list | grep -E "pdf-service|id.*name.*status" || echo "   ⚠️ Service pdf-service non trouvé dans PM2"

echo ""
echo "🔧 Test du service en local sur le serveur..."
LOCAL_TEST=$(curl -s http://localhost:3001/health 2>&1 || echo "ERREUR")
if [[ "$LOCAL_TEST" == *"ERREUR"* ]] || [[ "$LOCAL_TEST" == *"Connection refused"* ]]; then
    echo "   ❌ Le service ne répond pas sur localhost:3001"
    echo "   💡 Le service n'est probablement pas démarré"
else
    echo "   ✅ Le service répond en local"
    echo "$LOCAL_TEST" | python3 -m json.tool 2>/dev/null || echo "$LOCAL_TEST"
fi

echo ""
echo "🔍 Vérification des dépendances..."
echo -n "   Ghostscript: "
if command -v gs &> /dev/null; then
    echo "✅ $(gs --version)"
else
    echo "❌ Non installé"
fi

echo -n "   LibreOffice: "
if command -v soffice &> /dev/null; then
    SOFFICE_VERSION=$(soffice --version 2>/dev/null || echo "Erreur")
    echo "✅ $SOFFICE_VERSION"
else
    echo "❌ Non installé"
fi

echo ""
echo "📝 Dernières lignes des logs PM2..."
pm2 logs pdf-service --lines 10 --nostream 2>/dev/null || echo "   ⚠️ Impossible de lire les logs"

echo ""
echo "🌐 Configuration Nginx pour /pdf..."
if [ -f /etc/nginx/sites-enabled/ges-cab ]; then
    grep -A 5 "location /pdf" /etc/nginx/sites-enabled/ges-cab | head -10 || echo "   ⚠️ Configuration /pdf non trouvée"
else
    echo "   ⚠️ Fichier de configuration Nginx non trouvé"
fi

ENDSSH

echo ""
echo "================================================"
echo "🎯 Recommandations"
echo "================================================"

if [ "$HTTP_CODE" = "500" ]; then
    echo "Le service répond avec une erreur 500. Causes possibles:"
    echo "  1. Le service est démarré mais Ghostscript/LibreOffice ne sont pas installés"
    echo "  2. Problème de permissions sur les fichiers temporaires"
    echo "  3. Erreur dans le code du service"
    echo ""
    echo "Actions suggérées:"
    echo "  • Vérifier les logs: ssh $SERVER 'pm2 logs pdf-service --lines 50'"
    echo "  • Redémarrer le service: ssh $SERVER 'pm2 restart pdf-service'"
    echo "  • Installer les dépendances: ./ensure-pdf-service.sh"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "Nginx ne peut pas joindre le service. Le service n'est probablement pas démarré."
    echo ""
    echo "Actions suggérées:"
    echo "  • Démarrer le service: ssh $SERVER 'cd $PDF_SERVICE_DIR && pm2 start index.js --name pdf-service'"
    echo "  • Ou utiliser le script: ./ensure-pdf-service.sh"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Tout semble fonctionner correctement!"
    echo ""
    echo "Si vous voyez toujours l'erreur 500 dans le navigateur:"
    echo "  • Videz le cache du navigateur (Ctrl+Shift+R)"
    echo "  • Vérifiez la console navigateur pour voir si l'erreur persiste"
else
    echo "Statut inattendu. Vérifiez la connectivité réseau et la configuration Nginx."
fi

echo ""
