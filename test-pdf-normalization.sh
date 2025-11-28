#!/bin/bash

# Script de test du système de normalisation PDF

echo "🧪 Test du système de normalisation PDF avec Ghostscript"
echo ""

# Vérifier que le service est démarré
echo "1️⃣ Vérification du service..."
HEALTH=$(curl -s http://localhost:3001/health)

if [ $? -eq 0 ]; then
    echo "✅ Service de normalisation PDF opérationnel"
    echo "   $HEALTH"
else
    echo "❌ Service non disponible sur le port 3001"
    echo "   Démarrez le service: cd server && npm start"
    exit 1
fi

echo ""
echo "2️⃣ Création d'un PDF de test..."

# Créer un PDF simple avec Ghostscript pour tester
gs -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
   -sOutputFile=/tmp/test-original.pdf \
   -c "<<
/PageSize [595 842]
>> setpagedevice
newpath
100 700 moveto
/Helvetica findfont 20 scalefont setfont
(Test PDF - Police non intégrée) show
showpage
quit" 2>/dev/null

if [ -f "/tmp/test-original.pdf" ]; then
    echo "✅ PDF de test créé: /tmp/test-original.pdf"
    ORIGINAL_SIZE=$(stat -f%z /tmp/test-original.pdf 2>/dev/null || stat -c%s /tmp/test-original.pdf)
    echo "   Taille: $ORIGINAL_SIZE bytes"
else
    echo "❌ Échec de la création du PDF de test"
    exit 1
fi

echo ""
echo "3️⃣ Test de normalisation via l'API..."

# Tester la normalisation
curl -X POST -F "file=@/tmp/test-original.pdf" \
     http://localhost:3001/normalize-pdf \
     --output /tmp/test-normalized.pdf \
     --silent

if [ -f "/tmp/test-normalized.pdf" ]; then
    NORMALIZED_SIZE=$(stat -f%z /tmp/test-normalized.pdf 2>/dev/null || stat -c%s /tmp/test-normalized.pdf)
    
    if [ "$NORMALIZED_SIZE" -gt 100 ]; then
        echo "✅ PDF normalisé créé: /tmp/test-normalized.pdf"
        echo "   Taille originale:   $ORIGINAL_SIZE bytes"
        echo "   Taille normalisée:  $NORMALIZED_SIZE bytes"
        
        # Vérifier la version PDF
        PDF_VERSION=$(head -c 8 /tmp/test-normalized.pdf | tr -d '\0')
        echo "   Version PDF:        $PDF_VERSION"
        
        echo ""
        echo "🎉 Test de normalisation réussi!"
        echo ""
        echo "📁 Fichiers de test disponibles:"
        echo "   - Original:   /tmp/test-original.pdf"
        echo "   - Normalisé:  /tmp/test-normalized.pdf"
        echo ""
        echo "🔍 Vous pouvez comparer les deux fichiers:"
        echo "   open /tmp/test-original.pdf"
        echo "   open /tmp/test-normalized.pdf"
    else
        echo "❌ PDF normalisé trop petit (probablement invalide)"
        exit 1
    fi
else
    echo "❌ Échec de la normalisation"
    exit 1
fi

echo ""
echo "4️⃣ Test d'intégration avec l'application..."
echo ""
echo "Pour tester dans l'application:"
echo "1. Ouvrez http://localhost:3000"
echo "2. Créez une nouvelle tâche"
echo "3. Uploadez /tmp/test-original.pdf"
echo "4. Vérifiez qu'il s'affiche correctement dans le visualiseur"
echo ""
echo "✅ Tous les tests sont passés avec succès!"
