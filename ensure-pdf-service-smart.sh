#!/bin/bash

# Script intelligent de lancement du service PDF
# Vérifie si le service tourne déjà avant de le démarrer

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Port du service PDF
PDF_PORT=3001

# Vérifier si le service est déjà actif
if lsof -Pi :$PDF_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✅ Service PDF déjà actif sur le port $PDF_PORT${NC}"
    echo -e "${GREEN}🚀 Service PDF actif — les fichiers seront normalisés pour la prévisualisation${NC}"
    exit 0
fi

# Vérifier que Ghostscript est installé
if ! command -v gs &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ghostscript non installé — normalisation PDF désactivée${NC}"
    echo -e "${YELLOW}📦 Pour activer: brew install ghostscript${NC}"
    exit 0
fi

# Vérifier que les dépendances du serveur sont installées
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installation des dépendances du service PDF..."
    (cd server && npm install) || {
        echo -e "${YELLOW}⚠️  Impossible d'installer les dépendances du service PDF${NC}"
        exit 0
    }
fi

# Démarrer le service de normalisation PDF en arrière-plan
echo -e "${BLUE}🔧 Démarrage du service de normalisation PDF...${NC}"
(cd server && nohup node index.js > /dev/null 2>&1 &)

# Attendre que le service soit prêt (max 5 secondes)
for i in {1..10}; do
    if curl -s http://localhost:$PDF_PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Service de normalisation PDF opérationnel${NC}"
        echo -e "${GREEN}🚀 Service PDF actif — les fichiers seront normalisés pour la prévisualisation${NC}"
        exit 0
    fi
    sleep 0.5
done

echo -e "${YELLOW}⚠️  Service PDF n'a pas pu démarrer — les PDF seront uploadés sans normalisation${NC}"
exit 0
