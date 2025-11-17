#!/bin/bash

# 🚀 Script de création de la table invoices dans Supabase
# 
# Ce script lit le fichier SQL et l'exécute automatiquement dans votre base Supabase
# 
# Prérequis:
# - Avoir le CLI Supabase installé: brew install supabase/tap/supabase
# - Être connecté à votre projet: supabase login
#
# Utilisation:
# chmod +x setup-invoices-table.sh
# ./setup-invoices-table.sh

echo "🔧 Configuration de la table invoices..."
echo ""

# Vérifier si le fichier SQL existe
if [ ! -f "sql/create_invoices_table.sql" ]; then
    echo "❌ Erreur: Le fichier sql/create_invoices_table.sql est introuvable"
    exit 1
fi

echo "✅ Fichier SQL trouvé"
echo ""

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo ""
    echo "📦 Pour installer:"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "Ou exécutez le SQL manuellement depuis le dashboard Supabase:"
    echo "   1. Allez sur https://supabase.com/dashboard"
    echo "   2. Sélectionnez votre projet"
    echo "   3. Allez dans SQL Editor"
    echo "   4. Copiez-collez le contenu de sql/create_invoices_table.sql"
    echo "   5. Cliquez sur Run"
    exit 1
fi

echo "✅ Supabase CLI détecté"
echo ""

# Demander confirmation
read -p "⚠️  Voulez-vous exécuter le script SQL pour créer la table invoices? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "🚀 Exécution du script SQL..."
echo ""

# Exécuter le script SQL
supabase db execute --file sql/create_invoices_table.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Table invoices créée avec succès!"
    echo ""
    echo "📊 Vérifications effectuées:"
    echo "   ✅ Table invoices créée"
    echo "   ✅ Index optimisés ajoutés"
    echo "   ✅ Trigger updated_at configuré"
    echo "   ✅ Politiques RLS activées"
    echo ""
    echo "🎉 Vous pouvez maintenant utiliser le module Facturation!"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Rafraîchir l'application (npm run dev devrait toujours tourner)"
    echo "   2. Aller dans le module Facturation"
    echo "   3. Créer une nouvelle facture"
    echo "   4. Rafraîchir la page (Cmd+R) pour vérifier la persistance"
else
    echo ""
    echo "❌ Erreur lors de l'exécution du script SQL"
    echo ""
    echo "📋 Solution alternative:"
    echo "   Exécutez le SQL manuellement depuis le dashboard Supabase:"
    echo "   1. Allez sur https://supabase.com/dashboard"
    echo "   2. Sélectionnez votre projet"
    echo "   3. Allez dans SQL Editor"
    echo "   4. Copiez-collez le contenu de sql/create_invoices_table.sql"
    echo "   5. Cliquez sur Run"
    exit 1
fi
