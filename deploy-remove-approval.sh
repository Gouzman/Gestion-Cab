#!/bin/bash

# ============================================
# Script de déploiement : Suppression approbation admin
# ============================================
# Ce script déploie les modifications pour supprimer
# l'exigence d'approbation administrateur
# ============================================

set -e  # Arrêter en cas d'erreur

echo "============================================"
echo "🚀 DÉPLOIEMENT : Suppression approbation admin"
echo "============================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. Vérifications préliminaires
# ============================================
echo -e "${BLUE}📋 Étape 1 : Vérifications préliminaires${NC}"

if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Fichier .env introuvable${NC}"
  echo "Créez un fichier .env avec vos variables d'environnement"
  exit 1
fi

if [ ! -f "sql/internal_auth_system.sql" ]; then
  echo -e "${RED}❌ Fichier sql/internal_auth_system.sql introuvable${NC}"
  exit 1
fi

if [ ! -f "sql/MIGRATION_AUTO_ACTIVATION.sql" ]; then
  echo -e "${RED}❌ Fichier sql/MIGRATION_AUTO_ACTIVATION.sql introuvable${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Tous les fichiers nécessaires sont présents${NC}"
echo ""

# ============================================
# 2. Chargement des variables d'environnement
# ============================================
echo -e "${BLUE}📋 Étape 2 : Chargement des variables d'environnement${NC}"

source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Variables d'environnement manquantes${NC}"
  echo "Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies"
  exit 1
fi

echo -e "${GREEN}✅ Variables d'environnement chargées${NC}"
echo ""

# ============================================
# 3. Sauvegarde de la base de données
# ============================================
echo -e "${BLUE}📋 Étape 3 : Sauvegarde de la base de données${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT : Créez une sauvegarde manuelle via Supabase Dashboard${NC}"
echo "   Dashboard → Database → Backups → Create backup"
echo ""
read -p "Avez-vous créé une sauvegarde ? (o/n) : " backup_done

if [ "$backup_done" != "o" ] && [ "$backup_done" != "O" ]; then
  echo -e "${RED}❌ Déploiement annulé. Veuillez créer une sauvegarde d'abord.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Sauvegarde confirmée${NC}"
echo ""

# ============================================
# 4. Mise à jour de la fonction SQL
# ============================================
echo -e "${BLUE}📋 Étape 4 : Mise à jour de la fonction internal_login${NC}"
echo "Cette étape supprime la vérification d'approbation admin"
echo ""

read -p "Voulez-vous appliquer la nouvelle fonction SQL ? (o/n) : " apply_function

if [ "$apply_function" == "o" ] || [ "$apply_function" == "O" ]; then
  echo -e "${YELLOW}⚠️  Copiez et collez le contenu de sql/internal_auth_system.sql${NC}"
  echo "   dans Supabase SQL Editor et exécutez-le"
  echo ""
  echo "   Dashboard → SQL Editor → New query → Coller → Run"
  echo ""
  read -p "Fonction SQL appliquée ? (o/n) : " function_done
  
  if [ "$function_done" != "o" ] && [ "$function_done" != "O" ]; then
    echo -e "${RED}❌ Déploiement annulé${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Fonction SQL mise à jour${NC}"
else
  echo -e "${YELLOW}⚠️  Étape ignorée${NC}"
fi
echo ""

# ============================================
# 5. Migration des comptes existants
# ============================================
echo -e "${BLUE}📋 Étape 5 : Activation des comptes existants${NC}"
echo "Cette étape active tous les comptes en attente d'approbation"
echo ""

read -p "Voulez-vous activer tous les comptes existants ? (o/n) : " activate_accounts

if [ "$activate_accounts" == "o" ] || [ "$activate_accounts" == "O" ]; then
  echo -e "${YELLOW}⚠️  Copiez et collez le contenu de sql/MIGRATION_AUTO_ACTIVATION.sql${NC}"
  echo "   dans Supabase SQL Editor et exécutez-le"
  echo ""
  echo "   Dashboard → SQL Editor → New query → Coller → Run"
  echo ""
  read -p "Migration appliquée ? (o/n) : " migration_done
  
  if [ "$migration_done" != "o" ] && [ "$migration_done" != "O" ]; then
    echo -e "${RED}❌ Déploiement annulé${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Comptes activés${NC}"
else
  echo -e "${YELLOW}⚠️  Étape ignorée${NC}"
fi
echo ""

# ============================================
# 6. Construction du frontend
# ============================================
echo -e "${BLUE}📋 Étape 6 : Construction du frontend${NC}"

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm n'est pas installé${NC}"
  exit 1
fi

echo "Installation des dépendances..."
npm install

echo "Build du projet..."
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Le dossier dist n'a pas été créé${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# ============================================
# 7. Tests de validation
# ============================================
echo -e "${BLUE}📋 Étape 7 : Tests de validation recommandés${NC}"
echo ""
echo "Tests à effectuer manuellement :"
echo "1. ✅ Créer un nouvel utilisateur via Settings > Collaborateurs"
echo "2. ✅ Se connecter avec ce nouvel utilisateur"
echo "3. ✅ Vérifier que FirstLoginScreen s'affiche"
echo "4. ✅ Changer le mot de passe"
echo "5. ✅ Vérifier l'accès au dashboard"
echo "6. ✅ Se déconnecter et se reconnecter"
echo "7. ✅ Vérifier qu'aucun FirstLoginScreen ne s'affiche"
echo ""

# ============================================
# 8. Résumé et prochaines étapes
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "============================================"
echo ""
echo "Fichiers modifiés :"
echo "  📄 sql/internal_auth_system.sql (fonction internal_login mise à jour)"
echo "  📄 sql/MIGRATION_AUTO_ACTIVATION.sql (script de migration)"
echo "  📄 src/contexts/InternalAuthContext.jsx (messages d'erreur)"
echo "  📄 dist/ (build frontend)"
echo ""
echo "Prochaines étapes :"
echo "  1. Déployer le dossier dist/ sur votre serveur"
echo "  2. Redémarrer le service PDF si nécessaire"
echo "  3. Effectuer les tests de validation listés ci-dessus"
echo "  4. Communiquer les nouveaux identifiants aux utilisateurs"
echo ""
echo "Documentation complète :"
echo "  📖 SUPPRESSION_APPROBATION_ADMIN.md"
echo ""
echo -e "${GREEN}🎉 Félicitations ! Le système est prêt${NC}"
echo ""
