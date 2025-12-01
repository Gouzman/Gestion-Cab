#!/bin/bash

# Script de déploiement avec correction du service PDF
# Corrige l'erreur 500 sur /pdf/health

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement avec correction du service PDF"
echo "=============================================="

# 1. Déployer le frontend
echo ""
echo "📦 1/3 - Déploiement du frontend..."
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
echo "✅ Frontend déployé"

# 2. Déployer le service PDF mis à jour
echo ""
echo "📄 2/3 - Déploiement du service PDF corrigé..."
scp server/index.js root@82.25.116.122:/var/www/Ges-Cab/pdf-service/
echo "✅ Service PDF déployé"

# 3. Redémarrer le service PDF sur le serveur
echo ""
echo "🔄 3/3 - Redémarrage du service PDF..."
ssh root@82.25.116.122 << 'ENDSSH'
cd /var/www/Ges-Cab/pdf-service

# Arrêter le service existant
if pm2 list | grep -q "pdf-service"; then
    echo "Arrêt du service existant..."
    pm2 stop pdf-service
    pm2 delete pdf-service
fi

# Redémarrer avec PM2
echo "Démarrage du service PDF..."
pm2 start index.js --name pdf-service --time
pm2 save

# Vérifier le statut
echo ""
echo "📊 Statut du service:"
pm2 list

# Test health check
echo ""
echo "🏥 Test du health check:"
sleep 2
curl -s http://localhost:3001/health | json_pp || echo "Note: json_pp non disponible, voici la réponse brute:"
curl -s http://localhost:3001/health

ENDSSH

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "🔍 Vérifications à effectuer:"
echo "   1. Tester: https://www.ges-cab.com/pdf/health"
echo "   2. L'alerte PDF ne devrait plus apparaître"
echo "   3. Les conversions Word→PDF et normalisation PDF fonctionnent"
echo ""
echo "📝 Changements appliqués:"
echo "   - CORS corrigé avec whitelist pour www.ges-cab.com"
echo "   - Health check retourne toujours 200 OK (pas 500)"
echo "   - Headers CORS explicites sur /health"
echo "   - Timeout de 3s sur les checks Ghostscript/LibreOffice"
echo "   - Frontend met à jour l'alerte pour accepter status 'partial'"
