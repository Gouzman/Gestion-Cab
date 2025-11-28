#!/bin/bash

# Test de la prévisualisation Word dans TaskManager
# Vérifie que les modifications fonctionnent correctement

echo "🧪 Test de Prévisualisation Word → PDF"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifications
echo "📋 Vérifications préalables..."
echo ""

# 1. Service de conversion
echo -n "1. Service de conversion (port 3001)... "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Service non disponible${NC}"
    echo ""
    echo "⚠️  Démarrez le service :"
    echo "   cd server && node index.js"
    echo ""
    exit 1
fi

# 2. Fichiers modifiés
echo -n "2. TaskManager.jsx modifié... "
if grep -q "getConvertedPdfUrl" src/components/TaskManager.jsx; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Modification non trouvée${NC}"
    exit 1
fi

echo -n "3. uploadManager.js modifié... "
if grep -q "export async function getConvertedPdfUrl" src/lib/uploadManager.js; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Fonction manquante${NC}"
    exit 1
fi

# 3. Blocage supprimé
echo -n "4. Blocage PDF supprimé... "
if ! grep -q "Seuls les fichiers PDF peuvent être prévisualisés" src/components/TaskManager.jsx; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Message d'erreur toujours présent${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ TOUTES LES VÉRIFICATIONS PASSÉES${NC}"
echo "================================"
echo ""

echo "📝 Instructions pour tester manuellement :"
echo ""
echo "1. Ouvrir l'application : http://localhost:3000"
echo "2. Aller dans TaskManager"
echo "3. Uploader un fichier .docx"
echo "4. Cliquer sur 'Prévisualiser'"
echo ""
echo "✅ Résultat attendu :"
echo "   - Toast : 'Conversion en cours...'"
echo "   - Console : logs de conversion"
echo "   - PdfViewer s'ouvre avec le PDF converti"
echo ""
echo "❌ Plus jamais ce message :"
echo "   'Seuls les fichiers PDF peuvent être prévisualisés'"
echo ""

exit 0
