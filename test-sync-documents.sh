#!/bin/bash
# Script de test de la synchronisation documents ↔ tâches ↔ dossiers

echo "🧪 TEST DE SYNCHRONISATION DOCUMENTS"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
test_sync() {
  local test_name=$1
  local expected=$2
  local result=$3
  
  if [ "$result" == "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $test_name"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} - $test_name"
    echo "   Attendu: $expected"
    echo "   Reçu: $result"
    return 1
  fi
}

echo "📋 Prérequis"
echo "------------"
echo "1. Migration sql/add_case_id_to_tasks_files.sql exécutée"
echo "2. Migration sql/sync_documents_tasks_cases.sql exécutée"
echo "3. Serveur Supabase accessible"
echo ""

echo "🔍 Vérifications SQL"
echo "--------------------"

# Test 1: Vérifier que case_id existe dans tasks_files
echo "Test 1: Colonne case_id existe dans tasks_files"
psql_cmd="SELECT COUNT(*) FROM information_schema.columns WHERE table_name='tasks_files' AND column_name='case_id';"
echo "   SQL: $psql_cmd"
echo ""

# Test 2: Vérifier que le trigger existe
echo "Test 2: Trigger trigger_sync_task_file_to_case existe"
psql_cmd="SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name='trigger_sync_task_file_to_case';"
echo "   SQL: $psql_cmd"
echo ""

# Test 3: Vérifier que la fonction RPC existe
echo "Test 3: Fonction get_case_documents existe"
psql_cmd="SELECT COUNT(*) FROM pg_proc WHERE proname='get_case_documents';"
echo "   SQL: $psql_cmd"
echo ""

# Test 4: Vérifier la contrainte CHECK
echo "Test 4: Contrainte tasks_files_check_link existe"
psql_cmd="SELECT COUNT(*) FROM pg_constraint WHERE conname='tasks_files_check_link';"
echo "   SQL: $psql_cmd"
echo ""

echo "📝 Tests Manuels à Effectuer"
echo "----------------------------"
echo ""

echo "Scénario 1: Upload document dans une tâche liée à un dossier"
echo "1. Créer un dossier via CaseManager"
echo "2. Créer une tâche liée à ce dossier"
echo "3. Uploader un fichier dans la tâche"
echo "4. ${YELLOW}VÉRIFIER${NC}: Document visible dans le dossier"
echo "5. ${YELLOW}VÉRIFIER${NC}: 2 entrées dans tasks_files (une avec task_id, une avec case_id)"
echo ""

echo "Scénario 2: Upload document directement dans un dossier"
echo "1. Aller dans Documents"
echo "2. Transférer un document et lier à un dossier"
echo "3. ${YELLOW}VÉRIFIER${NC}: Document visible dans DocumentManager"
echo "4. ${YELLOW}VÉRIFIER${NC}: Document visible dans toutes tâches du dossier"
echo ""

echo "Scénario 3: Suppression d'un document de tâche"
echo "1. Supprimer un document uploadé dans une tâche"
echo "2. ${YELLOW}VÉRIFIER${NC}: Document supprimé aussi de la vue dossier"
echo "3. ${YELLOW}VÉRIFIER${NC}: Pas de référence orpheline dans tasks_files"
echo ""

echo "Scénario 4: Pas de doublons"
echo "1. Uploader le même fichier dans 2 tâches du même dossier"
echo "2. ${YELLOW}VÉRIFIER${NC}: Fichier apparaît une seule fois dans la vue dossier"
echo "3. ${YELLOW}VÉRIFIER${NC}: Déduplication par file_url fonctionne"
echo ""

echo "📊 Requêtes de Vérification SQL"
echo "--------------------------------"
echo ""

echo "-- Voir tous les documents d'un dossier"
echo "SELECT * FROM get_case_documents('<case-uuid>');"
echo ""

echo "-- Voir tous les documents d'une tâche (avec hérités)"
echo "SELECT * FROM get_task_documents('<task-uuid>');"
echo ""

echo "-- Vérifier les doublons potentiels"
echo "SELECT file_url, COUNT(*) as count"
echo "FROM tasks_files"
echo "WHERE case_id = '<case-uuid>'"
echo "GROUP BY file_url"
echo "HAVING COUNT(*) > 1;"
echo ""

echo "-- Voir la structure des entrées tasks_files"
echo "SELECT"
echo "  id,"
echo "  task_id,"
echo "  case_id,"
echo "  file_name,"
echo "  CASE"
echo "    WHEN task_id IS NOT NULL AND case_id IS NOT NULL THEN 'Task+Case'"
echo "    WHEN task_id IS NOT NULL THEN 'Task Only'"
echo "    WHEN case_id IS NOT NULL THEN 'Case Only'"
echo "  END as type"
echo "FROM tasks_files"
echo "ORDER BY created_at DESC"
echo "LIMIT 20;"
echo ""

echo "✅ Tests à Valider"
echo "------------------"
echo "[ ] 1. Colonne case_id existe"
echo "[ ] 2. Trigger sync_task_file_to_case actif"
echo "[ ] 3. Fonction get_case_documents disponible"
echo "[ ] 4. Fonction get_task_documents disponible"
echo "[ ] 5. Contrainte CHECK task_id OR case_id"
echo "[ ] 6. Document tâche → visible dans dossier"
echo "[ ] 7. Document dossier → visible dans tâches"
echo "[ ] 8. Pas de doublons dans affichage"
echo "[ ] 9. Suppression cascade fonctionne"
echo "[ ] 10. DocumentManager affiche source (task/case)"
echo ""

echo "🚀 Pour exécuter ce test:"
echo "1. Assurez-vous que les migrations SQL sont appliquées"
echo "2. Relancez: npm run dev"
echo "3. Testez manuellement les scénarios ci-dessus"
echo "4. Vérifiez les requêtes SQL dans Supabase Dashboard"
echo ""
