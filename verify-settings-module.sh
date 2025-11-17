#!/bin/bash

# ============================================
# Script de vérification du module Paramètres
# ============================================

echo "🔍 Vérification du module Paramètres..."
echo ""

# Compteur d'erreurs
errors=0

# 1. Vérifier que les fichiers ont été créés
echo "1️⃣ Vérification des fichiers créés"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

files=(
  "sql/create_app_settings_table.sql"
  "src/lib/appSettings.js"
  "src/components/CompanyInfoSettings.jsx"
  "src/components/MenuConfigSettings.jsx"
  "src/components/CategoriesConfigSettings.jsx"
  "GUIDE_MODULE_PARAMETRES.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file - MANQUANT"
    ((errors++))
  fi
done
echo ""

# 2. Vérifier que Settings.jsx a été modifié
echo "2️⃣ Vérification des modifications dans Settings.jsx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "CompanyInfoSettings" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Import CompanyInfoSettings présent"
else
  echo "   ❌ Import CompanyInfoSettings manquant"
  ((errors++))
fi

if grep -q "MenuConfigSettings" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Import MenuConfigSettings présent"
else
  echo "   ❌ Import MenuConfigSettings manquant"
  ((errors++))
fi

if grep -q "CategoriesConfigSettings" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Import CategoriesConfigSettings présent"
else
  echo "   ❌ Import CategoriesConfigSettings manquant"
  ((errors++))
fi

if grep -q "activeTab === 'company'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Entreprise' ajouté"
else
  echo "   ❌ Onglet 'Entreprise' manquant"
  ((errors++))
fi

if grep -q "activeTab === 'menu'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Menu' ajouté"
else
  echo "   ❌ Onglet 'Menu' manquant"
  ((errors++))
fi

if grep -q "activeTab === 'advanced-categories'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Catégories avancées' ajouté"
else
  echo "   ❌ Onglet 'Catégories avancées' manquant"
  ((errors++))
fi

echo ""

# 3. Vérifier que le code existant n'a pas été cassé
echo "3️⃣ Vérification de la compatibilité avec le code existant"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "activeTab === 'permissions'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Permissions' toujours présent"
else
  echo "   ❌ Onglet 'Permissions' a été supprimé"
  ((errors++))
fi

if grep -q "activeTab === 'admin'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Admin' toujours présent"
else
  echo "   ❌ Onglet 'Admin' a été supprimé"
  ((errors++))
fi

if grep -q "activeTab === 'categories'" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ Onglet 'Catégories' toujours présent"
else
  echo "   ❌ Onglet 'Catégories' a été supprimé"
  ((errors++))
fi

if grep -q "PermissionManager" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ PermissionManager toujours utilisé"
else
  echo "   ❌ PermissionManager a été supprimé"
  ((errors++))
fi

if grep -q "AdminUserHistory" src/components/Settings.jsx 2>/dev/null; then
  echo "   ✅ AdminUserHistory toujours utilisé"
else
  echo "   ❌ AdminUserHistory a été supprimé"
  ((errors++))
fi

echo ""

# 4. Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
  echo "✅ SUCCÈS : Tous les tests sont passés !"
  echo ""
  echo "📋 PROCHAINES ÉTAPES :"
  echo "   1. Exécutez sql/create_app_settings_table.sql dans Supabase"
  echo "   2. Rafraîchissez l'application (F5)"
  echo "   3. Allez dans Paramètres pour voir les nouveaux onglets"
  echo ""
  echo "📖 Consultez GUIDE_MODULE_PARAMETRES.md pour plus de détails"
else
  echo "❌ ERREUR : $errors test(s) ont échoué"
  echo ""
  echo "Veuillez vérifier les fichiers manquants ou les modifications incorrectes."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
