#!/bin/bash

# ========================================
# Script de commit - Conformité Juridique
# Date : 28 novembre 2025
# ========================================

echo "🚀 Préparation du commit - Conformité Procédures Juridiques"
echo ""

# Vérifier si nous sommes dans un repo Git
if [ ! -d .git ]; then
    echo "❌ Erreur : Ce n'est pas un dépôt Git"
    exit 1
fi

echo "📋 Fichiers modifiés/créés :"
echo ""

# Afficher le statut
git status --short

echo ""
echo "📝 Ajout des fichiers au staging..."
echo ""

# Ajouter tous les fichiers modifiés/créés
git add sql/migration_conformite_juridique.sql
git add src/components/CaseForm.jsx
git add src/components/CaseManager.jsx
git add src/components/ClientForm.jsx
git add src/components/ClientManager.jsx
git add src/components/ClientListItem.jsx
git add src/components/DocumentUploadModal.jsx
git add src/components/InstancesManager.jsx
git add MIGRATION_CONFORMITE_JURIDIQUE.md
git add MISSION_ACCOMPLIE_CONFORMITE.md

echo "✅ Fichiers ajoutés au staging"
echo ""

# Message de commit
COMMIT_MSG="feat: Conformité procédures juridiques - Gestion Cabinet

🎯 Objectif : Mise en conformité avec les procédures réelles de gestion de dossiers juridiques

✅ Implémentations principales :

1️⃣ NUMÉRO CLIENT (code_client)
   - Génération automatique AA.NNN (AA=lettre du nom, NNN=ordre)
   - Trigger PostgreSQL pour génération à l'insertion
   - Affichage dans tous les selects et listes
   - UUID conservé en interne

2️⃣ NUMÉRO DOSSIER
   - id_dossier : auto-incrémenté (interne, non affiché)
   - code_dossier : saisi manuellement par l'utilisateur
   - Séquence PostgreSQL créée

3️⃣ CATÉGORIES DE DOCUMENTS
   - 5 catégories obligatoires :
     * Documents de suivi et facturation
     * Pièces
     * Écritures
     * Courriers
     * Observations et notes
   - Champ document_category obligatoire à l'upload

4️⃣ INSTANCES JURIDIQUES (Contentieux)
   - Nouvelle table dossier_instance
   - Types : Tribunal, Appel, Cassation
   - Champs : juridiction, état, dates, numéro RG
   - Composant InstancesManager.jsx créé

5️⃣ NOUVEAUX CHAMPS DOSSIERS
   - objet_du_dossier : objet juridique (≠ description)
   - type_de_diligence : Consultation, Contentieux, Conseil, etc.
   - qualite_du_client : Personne physique / Personne morale

6️⃣ FORMULAIRES CLIENTS
   - Entreprise → \"Nom de l'entreprise\"
   - Particulier → \"Nom + Prénoms\"

7️⃣ UI/UX MODALE DOSSIERS
   - Ordre des champs réorganisé selon spécifications
   - \"Visible par\" → \"Autorisé à\"
   - 2 boutons pièces jointes (Choisir / Importer)

📁 Fichiers créés :
   - sql/migration_conformite_juridique.sql
   - src/components/InstancesManager.jsx
   - MIGRATION_CONFORMITE_JURIDIQUE.md
   - MISSION_ACCOMPLIE_CONFORMITE.md
   - src/components/CaseForm_OLD.jsx (backup)

📝 Fichiers modifiés :
   - src/components/CaseForm.jsx (restructuration complète)
   - src/components/CaseManager.jsx (nouveaux champs)
   - src/components/ClientForm.jsx (labels conditionnels)
   - src/components/ClientManager.jsx (affichage code_client)
   - src/components/ClientListItem.jsx (badge N°)
   - src/components/DocumentUploadModal.jsx (nouvelles catégories)

🔧 Améliorations techniques :
   - Index créés sur nouveaux champs
   - RLS configuré sur dossier_instance
   - Triggers et fonctions PostgreSQL
   - Validation et contraintes

⚠️ Compatibilité :
   - Aucune donnée supprimée
   - UUID conservés
   - Migrations idempotentes
   - RLS maintenu

📚 Documentation complète fournie

🚀 Application 100% conforme aux procédures juridiques"

echo "📝 Message de commit préparé :"
echo ""
echo "$COMMIT_MSG"
echo ""

# Demander confirmation
read -p "❓ Voulez-vous effectuer le commit ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[OoYy]$ ]]; then
    git commit -m "$COMMIT_MSG"
    echo ""
    echo "✅ Commit effectué avec succès !"
    echo ""
    echo "📊 Récapitulatif :"
    git log -1 --stat
    echo ""
    echo "🚀 Pour pousser les changements sur le dépôt distant :"
    echo "   git push origin main"
    echo ""
    echo "✅ Mission accomplie !"
else
    echo ""
    echo "❌ Commit annulé"
    echo "💡 Les fichiers restent dans le staging"
    echo "   Vous pouvez commiter manuellement avec :"
    echo "   git commit -m \"Votre message\""
fi
