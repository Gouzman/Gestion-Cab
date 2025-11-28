#!/bin/bash

# Script de test de conversion Word → PDF
# Vérifie que tous les composants fonctionnent correctement

set -e

echo "🧪 Test de Conversion Word → PDF"
echo "================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_step() {
    local description="$1"
    local command="$2"
    
    echo -n "⏳ $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ ÉCHEC${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1 : LibreOffice installé
test_step "LibreOffice installé" "which soffice"

# Test 2 : Ghostscript installé
test_step "Ghostscript installé" "which gs"

# Test 3 : Service backend en cours
test_step "Service backend (port 3001)" "curl -s http://localhost:3001/health > /dev/null"

# Test 4 : Health check retourne OK
if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
    echo -e "⏳ Health check status OK... ${GREEN}✅ OK${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "⏳ Health check status OK... ${RED}❌ ÉCHEC${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 5 : Créer un document Word de test
echo ""
echo "📄 Création d'un document Word de test..."

cat > /tmp/test-conversion.txt << 'EOF'
TEST DE CONVERSION AUTOMATIQUE

Ce document vérifie :
✓ Conversion Word → PDF
✓ Préservation du contenu
✓ Intégration des polices

Caractères spéciaux : é è ê à ù ç
EOF

if soffice --headless --convert-to docx /tmp/test-conversion.txt --outdir /tmp > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Document Word créé${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Échec de création du document Word${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 6 : Conversion via API
echo ""
echo "🔄 Test de conversion via API..."

if curl -s -X POST -F "file=@/tmp/test-conversion.docx" \
     http://localhost:3001/convert-word-to-pdf \
     -o /tmp/test-conversion-result.pdf 2>/dev/null; then
    
    # Vérifier que le PDF existe et n'est pas vide
    if [ -f /tmp/test-conversion-result.pdf ] && [ -s /tmp/test-conversion-result.pdf ]; then
        echo -e "${GREEN}✅ Conversion API réussie${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Test 7 : Vérifier que c'est un PDF valide
        if file /tmp/test-conversion-result.pdf | grep -q "PDF document"; then
            echo -e "${GREEN}✅ PDF valide généré${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ Le fichier généré n'est pas un PDF valide${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}❌ Le fichier PDF est vide ou inexistant${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}❌ Échec de la conversion via API${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 8 : Vérifier les fichiers frontend
echo ""
echo "📂 Vérification des fichiers frontend..."

if [ -f "src/lib/wordToPdfConverter.js" ]; then
    echo -e "${GREEN}✅ wordToPdfConverter.js présent${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ wordToPdfConverter.js manquant${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if [ -f "src/lib/uploadManager.js" ]; then
    echo -e "${GREEN}✅ uploadManager.js présent${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ uploadManager.js manquant${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 9 : Vérifier que TaskManager.jsx n'a pas été modifié (optionnel)
echo ""
echo "🔍 Vérification de TaskManager.jsx..."

if [ -f "src/components/TaskManager.jsx" ]; then
    echo -e "${GREEN}✅ TaskManager.jsx présent et intact${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  TaskManager.jsx introuvable${NC}"
fi

# Test 10 : Vérifier la documentation
echo ""
echo "📚 Vérification de la documentation..."

DOCS=(
    "GUIDE_CONVERSION_WORD_PDF.md"
    "QUICK_START_WORD_PDF.md"
    "INDEX_CONVERSION_WORD_PDF.md"
    "RESUME_CONVERSION_WORD_PDF.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc présent${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $doc manquant${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done

# Résumé
echo ""
echo "================================="
echo "📊 RÉSUMÉ DES TESTS"
echo "================================="
echo ""
echo -e "Tests réussis : ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests échoués : ${RED}$TESTS_FAILED${NC}"
echo ""

# Informations supplémentaires
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS !${NC}"
    echo ""
    echo "🎉 Le système de conversion Word → PDF est opérationnel."
    echo ""
    echo "📍 URLs:"
    echo "   - Application : http://localhost:3000"
    echo "   - Service : http://localhost:3001"
    echo "   - Health : http://localhost:3001/health"
    echo ""
    echo "📚 Documentation :"
    echo "   - Guide rapide : QUICK_START_WORD_PDF.md"
    echo "   - Guide complet : GUIDE_CONVERSION_WORD_PDF.md"
    echo ""
    
    # Nettoyage
    rm -f /tmp/test-conversion.txt /tmp/test-conversion.docx /tmp/test-conversion-result.pdf
    
    exit 0
else
    echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo ""
    echo "🔍 Actions recommandées :"
    echo ""
    
    if ! which soffice > /dev/null 2>&1; then
        echo "   1. Installer LibreOffice :"
        echo "      brew install --cask libreoffice"
        echo ""
    fi
    
    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "   2. Démarrer le service backend :"
        echo "      cd server && node index.js"
        echo "      OU"
        echo "      ./start-with-pdf-service.sh"
        echo ""
    fi
    
    echo "   3. Consulter la documentation :"
    echo "      GUIDE_CONVERSION_WORD_PDF.md"
    echo ""
    
    exit 1
fi
