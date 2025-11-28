#!/bin/bash

# Script de démarrage de l'application avec le service de normalisation PDF

echo "🚀 Démarrage de Gestion-Cab avec normalisation PDF..."

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour arrêter proprement les processus
cleanup() {
    echo -e "\n${GREEN}Arrêt des services...${NC}"
    kill $PDF_SERVICE_PID $VITE_PID 2>/dev/null
    exit 0
}

# Intercepter CTRL+C
trap cleanup INT TERM

# Vérifier que Ghostscript est installé
if ! command -v gs &> /dev/null; then
    echo "❌ ERREUR: Ghostscript n'est pas installé!"
    echo "📦 Installation: brew install ghostscript"
    exit 1
fi

echo -e "${GREEN}✅ Ghostscript $(gs --version) détecté${NC}"

# Vérifier que les dépendances du serveur sont installées
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installation des dépendances du service PDF..."
    cd server && npm install && cd ..
fi

# Démarrer le service de normalisation PDF
echo -e "${BLUE}🔧 Démarrage du service de normalisation PDF...${NC}"
cd server && node index.js &
PDF_SERVICE_PID=$!
cd ..

# Attendre que le service soit prêt
sleep 2

# Vérifier que le service est opérationnel
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Service de normalisation PDF opérationnel${NC}"
else
    echo "⚠️ Le service de normalisation PDF n'a pas pu démarrer"
    echo "Les PDF seront uploadés sans normalisation"
fi

# Démarrer l'application Vite
echo -e "${BLUE}🚀 Démarrage de l'application front-end...${NC}"
npm run dev &
VITE_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Application démarrée avec succès!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Front-end:           http://localhost:3000"
echo "📍 Service PDF:         http://localhost:3001"
echo "🏥 Health check:        http://localhost:3001/health"
echo ""
echo "⚙️  Fonctionnalités actives:"
echo "   ✓ Normalisation PDF avec Ghostscript"
echo "   ✓ Intégration complète des polices"
echo "   ✓ Compatibilité PDF.js garantie"
echo ""
echo "🛑 Appuyez sur CTRL+C pour arrêter les services"
echo ""

# Attendre que les processus se terminent
wait $PDF_SERVICE_PID $VITE_PID
