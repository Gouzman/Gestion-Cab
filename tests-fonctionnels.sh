#!/bin/bash

################################################################################
# Script de Test Fonctionnel - Gestion Cabinet
# Tests manuels à effectuer en développement
################################################################################

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   📋 GUIDE DE TESTS FONCTIONNELS MANUELS                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cat << 'EOF'

Ce guide vous permet de tester manuellement toutes les fonctionnalités
de l'application en développement.

═══════════════════════════════════════════════════════════════
1. TEST DE L'AUTHENTIFICATION
═══════════════════════════════════════════════════════════════

☐ Connexion avec un compte valide
☐ Gestion d'erreur de connexion
☐ Déconnexion
☐ Déconnexion automatique (15 min)

═══════════════════════════════════════════════════════════════
2. TEST DES CLIENTS
═══════════════════════════════════════════════════════════════

☐ Créer un nouveau client
☐ Modifier un client
☐ Supprimer un client
☐ Recherche de clients
☐ Clients conventionnés

═══════════════════════════════════════════════════════════════
3. TEST DES DOSSIERS
═══════════════════════════════════════════════════════════════

☐ Créer un nouveau dossier (code_dossier auto)
☐ Chemises de dossiers (groupes)
☐ Instances juridiques (Tribunal/Appel/Cassation)
☐ Filtrage des dossiers
☐ Affichage par code_dossier

═══════════════════════════════════════════════════════════════
4. TEST DES TÂCHES
═══════════════════════════════════════════════════════════════

☐ Créer une tâche
☐ Multi-assignation de tâches
☐ Fichiers attachés aux tâches
☐ Statuts des tâches
☐ Deadlines
☐ Visible only for assigned

═══════════════════════════════════════════════════════════════
5. TEST DES DOCUMENTS
═══════════════════════════════════════════════════════════════

☐ Upload de document PDF
☐ Prévisualisation PDF (service PDF)
☐ Téléchargement de document
☐ Conversion Word → PDF
☐ Catégorisation des documents
☐ Suppression de document

═══════════════════════════════════════════════════════════════
6. TEST DE LA FACTURATION
═══════════════════════════════════════════════════════════════

☐ Créer une facture
☐ Types de facture (normal / conventionné)
☐ Impression de facture (format A4)
☐ Statuts de paiement
☐ Historique des factures

═══════════════════════════════════════════════════════════════
7. TEST DU CALENDRIER ET DEADLINES
═══════════════════════════════════════════════════════════════

☐ Affichage du calendrier
☐ Deadlines dashboard
☐ Notifications de deadline

═══════════════════════════════════════════════════════════════
8. TEST DES PARAMÈTRES
═══════════════════════════════════════════════════════════════

☐ Informations entreprise (nom, logo, adresse)
☐ Configuration du menu
☐ Catégories avancées
☐ Apparence (thème, couleur)
☐ Permissions
☐ Permissions menu (Gérants)
☐ Historique Admin (Admin only)

═══════════════════════════════════════════════════════════════
9. TEST DES AVIS JURIDIQUES ANNUELS
═══════════════════════════════════════════════════════════════

☐ Créer un avis juridique
☐ Notifications d'expiration
☐ Renouvellement d'avis

═══════════════════════════════════════════════════════════════
10. TEST DE SÉCURITÉ ET PERMISSIONS
═══════════════════════════════════════════════════════════════

☐ Accès Admin (toutes sections)
☐ Accès Gérant (paramètres)
☐ Accès Avocat (limité)
☐ Accès Secrétaire (lecture/écriture)
☐ RLS Policies (blocage BDD)

═══════════════════════════════════════════════════════════════
11. TEST DE PERFORMANCE
═══════════════════════════════════════════════════════════════

☐ Temps de chargement initial
☐ Gestion de grandes listes (50+ éléments)
☐ Upload de gros fichiers (10+ Mo)

═══════════════════════════════════════════════════════════════
12. TEST DE COMPATIBILITÉ
═══════════════════════════════════════════════════════════════

☐ Navigateurs (Chrome, Firefox, Safari, Edge)
☐ Responsive (desktop, tablette, mobile)
☐ Modes d'affichage (sombre/clair)

═══════════════════════════════════════════════════════════════
RÉSUMÉ
═══════════════════════════════════════════════════════════════

✓ Tous les tests effectués
✓ Bugs documentés
✓ Priorité 2 supprimée
✓ Lancer ./test-production.sh

EOF

echo ""
echo -e "${GREEN}Pour lancer l'application en mode dev :${NC}"
echo -e "${BLUE}npm run dev${NC}"
echo ""
echo -e "${GREEN}Pour consulter les logs du service PDF :${NC}"
echo -e "${BLUE}tail -f server/server.log${NC}"
echo ""
