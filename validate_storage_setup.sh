#!/bin/bash

# =====================================================
# Script de Validation : Installation RPC Storage
# Description: Vérifie que la solution est correctement installée
# Usage: ./validate_storage_setup.sh
# =====================================================

echo ""
echo "🔍 ======================================"
echo "🔍  VALIDATION DE L'INSTALLATION"
echo "🔍 ======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
passed=0
failed=0

# =====================================================
# 1. Vérifier que les fichiers SQL existent
# =====================================================

echo -e "${BLUE}📋 Vérification des fichiers SQL...${NC}"

if [ -f "sql/setup_storage.sql" ]; then
  echo -e "${GREEN}✅ sql/setup_storage.sql trouvé${NC}"
  ((passed++))
else
  echo -e "${RED}❌ sql/setup_storage.sql manquant${NC}"
  ((failed++))
fi

if [ -f "sql/test_storage_rpc.sql" ]; then
  echo -e "${GREEN}✅ sql/test_storage_rpc.sql trouvé${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠️  sql/test_storage_rpc.sql manquant (optionnel)${NC}"
fi

echo ""

# =====================================================
# 2. Vérifier le code uploadManager.js
# =====================================================

echo -e "${BLUE}📋 Vérification du code uploadManager.js...${NC}"

if grep -q "ensureAttachmentsBucket" "src/lib/uploadManager.js"; then
  echo -e "${GREEN}✅ Fonction ensureAttachmentsBucket() présente${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Fonction ensureAttachmentsBucket() manquante${NC}"
  ((failed++))
fi

if grep -q "supabase.rpc('create_attachments_bucket')" "src/lib/uploadManager.js"; then
  echo -e "${GREEN}✅ Appel RPC configuré${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Appel RPC non trouvé (utilise encore createBucket ?)${NC}"
  ((failed++))
fi

echo ""

# =====================================================
# 3. Vérifier la documentation
# =====================================================

echo -e "${BLUE}📋 Vérification de la documentation...${NC}"

doc_count=0

if [ -f "STORAGE_RPC_DEPLOYMENT_GUIDE.md" ]; then
  echo -e "${GREEN}✅ Guide de déploiement disponible${NC}"
  ((doc_count++))
  ((passed++))
fi

if [ -f "QUICK_START_STORAGE_RPC.md" ]; then
  echo -e "${GREEN}✅ Quick Start disponible${NC}"
  ((doc_count++))
  ((passed++))
fi

if [ -f "README_STORAGE_AUTO_SETUP.md" ]; then
  echo -e "${GREEN}✅ README disponible${NC}"
  ((doc_count++))
  ((passed++))
fi

if [ $doc_count -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Aucune documentation trouvée${NC}"
fi

echo ""

# =====================================================
# 4. Vérifier les imports dans les composants
# =====================================================

echo -e "${BLUE}📋 Vérification des imports...${NC}"

if grep -q "import { ensureAttachmentsBucket } from" "src/components/TaskCard.jsx"; then
  echo -e "${GREEN}✅ TaskCard.jsx importe ensureAttachmentsBucket${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠️  TaskCard.jsx n'importe pas ensureAttachmentsBucket${NC}"
fi

echo ""

# =====================================================
# 5. Instructions finales
# =====================================================

echo -e "${BLUE}🎯 ======================================"
echo -e "🎯  RÉSUMÉ"
echo -e "🎯 ======================================${NC}"
echo ""
echo -e "Tests réussis : ${GREEN}$passed${NC}"
echo -e "Tests échoués : ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}🎉 ======================================"
  echo -e "🎉  INSTALLATION VALIDÉE !"
  echo -e "🎉 ======================================${NC}"
  echo ""
  echo -e "${BLUE}📋 Prochaines étapes :${NC}"
  echo ""
  echo "1️⃣  Ouvrir Supabase Dashboard > SQL Editor"
  echo "2️⃣  Copier le contenu de sql/setup_storage.sql"
  echo "3️⃣  Cliquer sur 'Run' pour exécuter le script"
  echo "4️⃣  Exécuter sql/test_storage_rpc.sql pour valider"
  echo "5️⃣  Relancer l'application : npm run dev"
  echo "6️⃣  Tester l'upload d'un fichier"
  echo ""
  echo -e "${GREEN}✅ Le code est prêt, il ne manque que l'exécution SQL !${NC}"
  echo ""
  echo -e "${YELLOW}💡 Consultez QUICK_START_STORAGE_RPC.md pour les instructions détaillées${NC}"
else
  echo -e "${YELLOW}⚠️  ======================================"
  echo -e "⚠️  INSTALLATION INCOMPLÈTE"
  echo -e "⚠️  ======================================${NC}"
  echo ""
  echo -e "${BLUE}📋 Actions requises :${NC}"
  echo ""
  
  if [ ! -f "sql/setup_storage.sql" ]; then
    echo -e "${RED}❌ Fichier sql/setup_storage.sql manquant${NC}"
    echo "   → Créez le fichier avec la fonction RPC"
  fi
  
  if ! grep -q "supabase.rpc('create_attachments_bucket')" "src/lib/uploadManager.js"; then
    echo -e "${RED}❌ Code uploadManager.js non à jour${NC}"
    echo "   → Remplacez createBucket() par rpc()"
  fi
  
  echo ""
  echo -e "${YELLOW}💡 Consultez la documentation pour plus de détails${NC}"
fi

echo ""

# =====================================================
# 6. Afficher les commandes utiles
# =====================================================

echo -e "${BLUE}🔧 ======================================"
echo -e "🔧  COMMANDES UTILES"
echo -e "🔧 ======================================${NC}"
echo ""
echo "📄 Voir le contenu du script SQL :"
echo "   cat sql/setup_storage.sql"
echo ""
echo "📝 Ouvrir le Quick Start :"
echo "   cat QUICK_START_STORAGE_RPC.md"
echo ""
echo "🧪 Tester la fonction RPC (après installation) :"
echo "   # Dans Supabase SQL Editor"
echo "   SELECT * FROM public.create_attachments_bucket();"
echo ""
echo "🔍 Vérifier les permissions RLS :"
echo "   # Dans Supabase SQL Editor"
echo "   SELECT * FROM public.check_storage_permissions();"
echo ""
echo "🚀 Relancer l'application :"
echo "   npm run dev"
echo ""

exit 0
