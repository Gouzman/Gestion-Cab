#!/bin/bash

# Script pour vérifier et démarrer le service PDF si nécessaire

echo "🔍 Vérification du service de normalisation PDF..."

# Vérifier si le service répond
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Le service de normalisation PDF est déjà démarré"
    exit 0
fi

echo "⚠️ Service non détecté, démarrage..."

# Vérifier que Ghostscript est installé
if ! command -v gs &> /dev/null; then
    echo "❌ ERREUR: Ghostscript n'est pas installé!"
    echo "📦 Installation: brew install ghostscript"
    exit 1
fi

# Vérifier que les dépendances sont installées
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installation des dépendances..."
    cd server && npm install && cd ..
fi

# Démarrer le service en arrière-plan
cd /Users/gouzman/Documents/Gestion-Cab
nohup node server/index.js > server/server.log 2>&1 &
PID=$!

echo "🚀 Service démarré (PID: $PID)"

# Attendre 2 secondes et vérifier
sleep 2

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Service opérationnel!"
else
    echo "❌ Le service n'a pas pu démarrer. Vérifiez server/server.log"
    exit 1
fi
