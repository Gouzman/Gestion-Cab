#!/bin/bash

################################################################################
# Script de Test Complet - Gestion Cabinet
# Vérifie tous les composants avant mise en production
################################################################################

# Ne pas arrêter en cas d'erreur pour pouvoir tout tester
# set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 TEST COMPLET DE L'APPLICATION - GESTION CABINET          ║${NC}"
echo -e "${BLUE}║   Date: $(date '+%Y-%m-%d %H:%M:%S')                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour afficher le résultat d'un test
test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ [OK]${NC} $test_name"
        ((TESTS_PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ [FAIL]${NC} $test_name"
        [ -n "$message" ] && echo -e "   ${RED}↳ $message${NC}"
        ((TESTS_FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  [WARN]${NC} $test_name"
        [ -n "$message" ] && echo -e "   ${YELLOW}↳ $message${NC}"
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. VÉRIFICATION DE L'ENVIRONNEMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Test Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_result "Node.js installé ($NODE_VERSION)" "OK"
else
    test_result "Node.js installé" "FAIL" "Node.js non trouvé"
fi

# Test npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    test_result "npm installé ($NPM_VERSION)" "OK"
else
    test_result "npm installé" "FAIL" "npm non trouvé"
fi

# Test des node_modules
if [ -d "node_modules" ]; then
    test_result "Dépendances installées (node_modules)" "OK"
else
    test_result "Dépendances installées" "WARN" "node_modules non trouvé, exécuter 'npm install'"
fi

# Test du fichier .env
if [ -f ".env" ]; then
    test_result "Fichier .env présent" "OK"
    
    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL=" .env && grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        test_result "Variables Supabase configurées" "OK"
    else
        test_result "Variables Supabase configurées" "FAIL" "VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant"
    fi
else
    test_result "Fichier .env présent" "FAIL" "Créer le fichier .env avec les configurations Supabase"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. VÉRIFICATION DE LA STRUCTURE DU PROJET${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier les dossiers critiques
declare -a CRITICAL_DIRS=(
    "src"
    "src/components"
    "src/lib"
    "src/contexts"
    "public"
)

for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        test_result "Dossier $dir existe" "OK"
    else
        test_result "Dossier $dir existe" "FAIL" "Dossier manquant"
    fi
done

# Vérifier les fichiers critiques
declare -a CRITICAL_FILES=(
    "package.json"
    "vite.config.js"
    "index.html"
    "src/main.jsx"
    "src/App.jsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_result "Fichier $file existe" "OK"
    else
        test_result "Fichier $file existe" "FAIL" "Fichier manquant"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. VÉRIFICATION DES COMPOSANTS PRINCIPAUX${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Liste des composants critiques
declare -a CRITICAL_COMPONENTS=(
    "src/components/ClientManager.jsx"
    "src/components/CaseManager.jsx"
    "src/components/TaskManager.jsx"
    "src/components/DocumentManager.jsx"
    "src/components/Settings.jsx"
    "src/components/LoginScreen.jsx"
    "src/components/InstanceManager.jsx"
    "src/components/GroupeDossiersManager.jsx"
    "src/components/InvoiceForm.jsx"
    "src/components/CompanyInfoSettings.jsx"
    "src/components/MenuConfigSettings.jsx"
    "src/components/CategoriesConfigSettings.jsx"
)

for component in "${CRITICAL_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        # Vérifier qu'il n'y a pas d'erreurs de syntaxe évidentes
        if grep -q "import.*from" "$component"; then
            test_result "Composant $(basename $component)" "OK"
        else
            test_result "Composant $(basename $component)" "WARN" "Aucun import détecté - vérifier la syntaxe"
        fi
    else
        test_result "Composant $(basename $component)" "FAIL" "Fichier manquant"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. VÉRIFICATION DES BIBLIOTHÈQUES ET CONTEXTES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier les fichiers lib
declare -a LIB_FILES=(
    "src/lib/customSupabaseClient.js"
    "src/lib/appSettings.js"
)

for lib in "${LIB_FILES[@]}"; do
    if [ -f "$lib" ]; then
        test_result "Bibliothèque $(basename $lib)" "OK"
    else
        test_result "Bibliothèque $(basename $lib)" "FAIL" "Fichier manquant"
    fi
done

# Vérifier les contextes
declare -a CONTEXTS=(
    "src/contexts/InternalAuthContext.jsx"
)

for context in "${CONTEXTS[@]}"; do
    if [ -f "$context" ]; then
        test_result "Contexte $(basename $context)" "OK"
    else
        test_result "Contexte $(basename $context)" "FAIL" "Fichier manquant"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. VÉRIFICATION DES IMPORTS ET DÉPENDANCES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier les packages critiques dans package.json
if [ -f "package.json" ]; then
    declare -a REQUIRED_PACKAGES=(
        "react"
        "react-dom"
        "vite"
        "@supabase/supabase-js"
        "lucide-react"
        "framer-motion"
    )
    
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if grep -q "\"$package\"" package.json; then
            test_result "Package $package dans package.json" "OK"
        else
            test_result "Package $package dans package.json" "WARN" "Package non trouvé"
        fi
    done
fi

# Vérifier qu'il n'y a pas de références aux composants supprimés
echo ""
echo -e "${YELLOW}Vérification des références aux composants supprimés (Priorité 2)...${NC}"

SUPPRESSED_COMPONENTS=(
    "WorkflowAttributionManager"
    "EtiquetteChemiseGenerator"
)

HAS_ORPHAN_REFS=false
for component in "${SUPPRESSED_COMPONENTS[@]}"; do
    if grep -r "$component" src/ --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "node_modules"; then
        test_result "Aucune référence orpheline à $component" "FAIL" "Des références existent encore"
        HAS_ORPHAN_REFS=true
    else
        test_result "Aucune référence orpheline à $component" "OK"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6. TEST DE COMPILATION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Tentative de build de production...${NC}"
if npm run build > /tmp/build-output.log 2>&1; then
    test_result "Build de production" "OK"
    
    # Vérifier que le dossier dist est créé
    if [ -d "dist" ]; then
        test_result "Génération du dossier dist" "OK"
        
        # Vérifier la taille du build
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo -e "   ${GREEN}↳ Taille du build: $DIST_SIZE${NC}"
    else
        test_result "Génération du dossier dist" "FAIL" "Dossier dist non créé"
    fi
else
    test_result "Build de production" "FAIL" "Erreurs de compilation détectées"
    echo -e "${RED}Consultez /tmp/build-output.log pour plus de détails${NC}"
    tail -n 20 /tmp/build-output.log
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}7. VÉRIFICATION DES SCRIPTS SQL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier les scripts SQL
if [ -d "sql" ]; then
    test_result "Dossier sql existe" "OK"
    
    SQL_COUNT=$(find sql -name "*.sql" | wc -l)
    echo -e "   ${GREEN}↳ $SQL_COUNT script(s) SQL trouvé(s)${NC}"
    
    # Vérifier le script de rollback Priorité 2
    if [ -f "sql/rollback_priorite2.sql" ]; then
        test_result "Script rollback_priorite2.sql présent" "OK"
        echo -e "   ${YELLOW}↳ IMPORTANT: Exécuter ce script en production pour nettoyer la BDD${NC}"
    else
        test_result "Script rollback_priorite2.sql présent" "WARN" "Script de nettoyage non trouvé"
    fi
else
    test_result "Dossier sql existe" "WARN" "Aucun script SQL trouvé"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}8. VÉRIFICATION DES SERVICES EXTERNES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier le service PDF
if [ -f "ensure-pdf-service-smart.sh" ]; then
    test_result "Script ensure-pdf-service-smart.sh présent" "OK"
    
    # Tester si le service PDF est actif
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        test_result "Service PDF actif sur port 3001" "OK"
    else
        test_result "Service PDF actif" "WARN" "Service non accessible, il sera démarré automatiquement"
    fi
else
    test_result "Script PDF présent" "WARN" "Script de service PDF non trouvé"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}9. VÉRIFICATION DE SÉCURITÉ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier qu'il n'y a pas de secrets exposés dans le code
echo -e "${YELLOW}Recherche de secrets potentiellement exposés...${NC}"

SECRETS_FOUND=false

# Recherche de clés API hardcodées
if grep -r "eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" src/ --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".env"; then
    test_result "Aucune clé JWT hardcodée" "FAIL" "Des tokens JWT ont été trouvés dans le code"
    SECRETS_FOUND=true
else
    test_result "Aucune clé JWT hardcodée" "OK"
fi

# Vérifier que .env n'est pas commité
if git ls-files --error-unmatch .env > /dev/null 2>&1; then
    test_result "Fichier .env non versionné" "FAIL" ".env est dans Git - DANGER"
else
    test_result "Fichier .env non versionné" "OK"
fi

# Vérifier .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore && grep -q "node_modules" .gitignore; then
        test_result ".gitignore correctement configuré" "OK"
    else
        test_result ".gitignore correctement configuré" "WARN" "Vérifier que .env et node_modules sont exclus"
    fi
else
    test_result ".gitignore présent" "WARN" "Fichier .gitignore manquant"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}10. RECOMMANDATIONS POUR LA PRODUCTION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}📋 Checklist de déploiement :${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Exécuter le script SQL de rollback en production :"
echo -e "    ${BLUE}psql \$DATABASE_URL -f sql/rollback_priorite2.sql${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Configurer les variables d'environnement sur le serveur"
echo -e "    - VITE_SUPABASE_URL"
echo -e "    - VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "  ${GREEN}✓${NC} Vérifier les RLS policies dans Supabase"
echo ""
echo -e "  ${GREEN}✓${NC} Configurer le service PDF en production"
echo ""
echo -e "  ${GREEN}✓${NC} Activer HTTPS pour la sécurité"
echo ""
echo -e "  ${GREEN}✓${NC} Configurer les sauvegardes automatiques de la BDD"
echo ""
echo -e "  ${GREEN}✓${NC} Tester l'authentification en production"
echo ""
echo -e "  ${GREEN}✓${NC} Vérifier les logs d'erreur après déploiement"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${GREEN}✅ Tests réussis    : $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests échoués    : $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Avertissements  : $WARNINGS${NC}"
echo ""

# Déterminer le statut global
if [ $TESTS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║   🎉 TOUS LES TESTS SONT PASSÉS - PRÊT POUR LA PRODUCTION     ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║   ⚠️  TESTS RÉUSSIS AVEC AVERTISSEMENTS                        ║${NC}"
        echo -e "${YELLOW}║   Vérifiez les avertissements avant le déploiement            ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
        exit 0
    fi
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ DES TESTS ONT ÉCHOUÉ - NE PAS DÉPLOYER                    ║${NC}"
    echo -e "${RED}║   Corrigez les erreurs avant de passer en production          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
