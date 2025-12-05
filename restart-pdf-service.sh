#!/bin/bash

# Script pour redémarrer le serveur PDF local
# Usage: ./restart-pdf-service.sh

set -e

echo "🔄 Redémarrage du service PDF local..."

# Arrêter tous les processus Node sur le port 3001
echo "1️⃣ Arrêt du service existant..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   Aucun service à arrêter"
sleep 1

# Démarrer le nouveau service
echo "2️⃣ Démarrage du nouveau service..."
cd "$(dirname "$0")"
node server/index.js > pdf-service.log 2>&1 &
PID=$!
echo "   Service démarré avec PID: $PID"

# Attendre le démarrage
echo "3️⃣ Vérification..."
sleep 2

# Tester le service
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo ""
    echo "✅ Service PDF opérationnel sur http://localhost:3001"
    echo ""
    curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/health
    echo ""
else
    echo ""
    echo "❌ Erreur lors du démarrage"
    echo "Logs:"
    tail -20 pdf-service.log
    exit 1
fi

echo ""
echo "💡 Pour voir les logs en temps réel:"
echo "   tail -f pdf-service.log"
echo ""
echo "💡 Pour arrêter le service:"
echo "   lsof -ti:3001 | xargs kill"
