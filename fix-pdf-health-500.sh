#!/bin/bash

# Script de correction automatique de l'erreur 500 sur /pdf/health
# Ce script déploie les corrections et redémarre le service

set -e

SERVER="root@82.25.116.122"
PDF_SERVICE_DIR="/var/www/Ges-Cab/pdf-service"

echo "🔧 Correction de l'erreur 500 sur /pdf/health"
echo "=============================================="
echo ""

# Vérifier que le fichier serveur existe localement
if [ ! -f "server/index.js" ]; then
    echo "❌ Fichier server/index.js introuvable"
    exit 1
fi

echo "1️⃣ Vérification du code serveur local..."
if grep -q "res.status(200).json" server/index.js; then
    echo "   ✅ Le code serveur retourne bien 200 OK"
else
    echo "   ⚠️ Le code serveur pourrait ne pas être à jour"
fi

echo ""
echo "2️⃣ Construction du frontend..."
npm run build

echo ""
echo "3️⃣ Déploiement du frontend mis à jour..."
scp -r dist/* $SERVER:/var/www/Ges-Cab/dist/

echo ""
echo "4️⃣ Déploiement du service PDF..."
scp server/index.js $SERVER:$PDF_SERVICE_DIR/
scp server/package.json $SERVER:$PDF_SERVICE_DIR/

echo ""
echo "5️⃣ Redémarrage du service sur le serveur..."
ssh $SERVER << 'ENDSSH'
cd /var/www/Ges-Cab/pdf-service

# Vérifier si le service existe dans PM2
if pm2 describe pdf-service &>/dev/null; then
    echo "   ♻️ Redémarrage du service existant..."
    pm2 restart pdf-service
else
    echo "   🚀 Démarrage d'un nouveau service..."
    pm2 start index.js --name pdf-service
fi

# Sauvegarder la configuration PM2
pm2 save

echo ""
echo "📊 État du service:"
pm2 list | grep -E "pdf-service|id.*name.*status"

ENDSSH

echo ""
echo "6️⃣ Vérification du service..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.ges-cab.com/pdf/health 2>/dev/null || echo "000")
echo "   Code HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "✅ LE SERVICE FONCTIONNE CORRECTEMENT!"
    echo ""
    curl -s https://www.ges-cab.com/pdf/health | python3 -m json.tool 2>/dev/null || curl -s https://www.ges-cab.com/pdf/health
    echo ""
    echo "🎉 Correction appliquée avec succès!"
    echo ""
    echo "📌 Actions à faire:"
    echo "  1. Vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)"
    echo "  2. Vérifier que l'erreur 500 n'apparaît plus dans la console"
    echo "  3. Tester l'upload d'un PDF pour vérifier la normalisation"
elif [ "$HTTP_CODE" = "500" ]; then
    echo ""
    echo "⚠️ Le service répond toujours avec une erreur 500"
    echo ""
    echo "Causes possibles:"
    echo "  • Ghostscript ou LibreOffice non installés sur le serveur"
    echo "  • Problème de permissions"
    echo "  • Erreur dans le code"
    echo ""
    echo "Pour diagnostiquer:"
    echo "  ./diagnose-pdf-service.sh"
    echo ""
    echo "Pour installer les dépendances:"
    echo "  ./ensure-pdf-service.sh"
elif [ "$HTTP_CODE" = "502" ]; then
    echo ""
    echo "❌ Erreur 502 - Le service n'a pas démarré"
    echo ""
    echo "Vérifier les logs:"
    echo "  ssh $SERVER 'pm2 logs pdf-service --lines 50'"
else
    echo ""
    echo "⚠️ Code HTTP inattendu: $HTTP_CODE"
    echo ""
    echo "Utilisez le script de diagnostic:"
    echo "  ./diagnose-pdf-service.sh"
fi

echo ""
echo "=============================================="
