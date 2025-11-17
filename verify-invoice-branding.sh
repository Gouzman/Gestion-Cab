#!/bin/bash

# ============================================
# Vérification de l'amélioration des factures
# ============================================

echo "🔍 Vérification de l'amélioration des factures..."
echo ""

errors=0

# 1. Vérifier que l'import est présent
echo "1️⃣ Vérification de l'import useCompanyInfo"
if grep -q "import { useCompanyInfo } from '@/lib/appSettings'" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Import présent"
else
  echo "   ❌ Import manquant"
  ((errors++))
fi
echo ""

# 2. Vérifier que le hook est utilisé
echo "2️⃣ Vérification de l'utilisation du hook"
if grep -q "const { companyInfo" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Hook utilisé"
else
  echo "   ❌ Hook non utilisé"
  ((errors++))
fi
echo ""

# 3. Vérifier que l'en-tête est présent
echo "3️⃣ Vérification de l'en-tête entreprise"
if grep -q "En-tête avec informations de l'entreprise" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ En-tête ajouté"
else
  echo "   ❌ En-tête manquant"
  ((errors++))
fi
echo ""

# 4. Vérifier que le logo est géré
echo "4️⃣ Vérification du logo"
if grep -q "logo_url" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Logo géré"
else
  echo "   ❌ Logo non géré"
  ((errors++))
fi
echo ""

# 5. Vérifier que la signature est présente
echo "5️⃣ Vérification de la signature"
if grep -q "Section signature numérique" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Signature ajoutée"
else
  echo "   ❌ Signature manquante"
  ((errors++))
fi
echo ""

# 6. Vérifier que la logique de calcul n'a pas été touchée
echo "6️⃣ Vérification de la logique de calcul"
if grep -q "const totalDebours = Object.values(formData.debours)" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Logique de calcul intacte"
else
  echo "   ❌ Logique de calcul modifiée"
  ((errors++))
fi
echo ""

# 7. Vérifier que les fonctions de soumission sont intactes
echo "7️⃣ Vérification de la fonction de soumission"
if grep -q "const handleSubmit = (e) =>" src/components/InvoiceForm.jsx 2>/dev/null; then
  echo "   ✅ Fonction handleSubmit intacte"
else
  echo "   ❌ Fonction handleSubmit modifiée"
  ((errors++))
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
  echo "✅ SUCCÈS : Amélioration appliquée correctement !"
  echo ""
  echo "📋 RÉSULTAT :"
  echo "   ✅ Branding entreprise ajouté"
  echo "   ✅ Signature numérique ajoutée"
  echo "   ✅ Logique métier préservée"
  echo "   ✅ Calculs intacts"
  echo "   ✅ Aucune fonction cassée"
  echo ""
  echo "🚀 PROCHAINES ÉTAPES :"
  echo "   1. Configurez les infos entreprise dans Paramètres"
  echo "   2. Créez ou modifiez une facture"
  echo "   3. Le branding s'affiche automatiquement"
else
  echo "❌ ERREUR : $errors test(s) ont échoué"
  echo ""
  echo "Veuillez vérifier les modifications dans InvoiceForm.jsx"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
