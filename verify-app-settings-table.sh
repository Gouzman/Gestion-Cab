#!/bin/bash

echo "🔍 Vérification de la configuration app_settings..."
echo ""

# Vérifier que le fichier SQL existe
if [ -f "sql/create_app_settings_table.sql" ]; then
  echo "✅ Fichier SQL trouvé: sql/create_app_settings_table.sql"
else
  echo "❌ Fichier SQL manquant: sql/create_app_settings_table.sql"
fi

echo ""
echo "📋 INSTRUCTIONS:"
echo ""
echo "1️⃣ Ouvrez Supabase Dashboard:"
echo "   https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/editor"
echo ""
echo "2️⃣ Allez dans SQL Editor"
echo ""
echo "3️⃣ Copiez et exécutez le contenu de:"
echo "   sql/create_app_settings_table.sql"
echo ""
echo "4️⃣ Rafraîchissez votre navigateur avec Cmd+Shift+R"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 RAISON DE L'ERREUR:"
echo "   L'application cherche 'app_metadata' (ancienne table)"
echo "   mais doit utiliser 'app_settings' (nouvelle structure)"
echo ""
echo "✅ CORRECTION APPLIQUÉE:"
echo "   Settings.jsx utilise maintenant 'app_settings'"
echo ""
echo "⚠️  SI L'ERREUR PERSISTE:"
echo "   1. Videz le cache: Cmd+Shift+R"
echo "   2. Vérifiez la console pour d'autres erreurs"
echo "   3. Relancez le serveur Vite"
echo ""
