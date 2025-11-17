#!/bin/bash

# Script d'aide pour configurer l'upload de fichiers
# Usage: chmod +x setup-file-upload.sh && ./setup-file-upload.sh

echo "📎 Configuration de l'Upload de Fichiers pour les Tâches"
echo "=========================================================="
echo ""

echo "✅ Analyse du code existant..."
sleep 1

# Vérifier que les fichiers nécessaires existent
if [ -f "src/lib/uploadManager.js" ] && [ -f "src/api/taskFiles.js" ]; then
    echo "✅ Code d'upload détecté : uploadManager.js, taskFiles.js"
else
    echo "❌ Fichiers manquants dans src/lib/ ou src/api/"
    exit 1
fi

if [ -f "src/components/TaskForm.jsx" ] && [ -f "src/components/TaskManager.jsx" ]; then
    echo "✅ Composants UI détectés : TaskForm.jsx, TaskManager.jsx"
else
    echo "❌ Composants UI manquants"
    exit 1
fi

if [ -f "sql/create_tasks_files_complete.sql" ]; then
    echo "✅ Script SQL détecté : create_tasks_files_complete.sql"
else
    echo "❌ Script SQL manquant"
    exit 1
fi

echo ""
echo "🎉 Tous les fichiers de code sont présents !"
echo ""
echo "⚠️  ACTIONS REQUISES (à faire manuellement) :"
echo ""
echo "1️⃣  Créer le bucket Supabase 'attachments' :"
echo "   → Ouvrir : https://supabase.com/dashboard"
echo "   → Storage > New bucket"
echo "   → Name: attachments"
echo "   → Public bucket: ✅ COCHÉ"
echo "   → Create bucket"
echo ""
echo "2️⃣  Créer la table tasks_files :"
echo "   → SQL Editor > New query"
echo "   → Copier le contenu de : sql/create_tasks_files_complete.sql"
echo "   → Run (▶️)"
echo ""
echo "3️⃣  Redémarrer le serveur :"
echo "   → Ctrl+C pour arrêter"
echo "   → npm run dev"
echo ""
echo "📖 Pour plus de détails, lire : GUIDE_ACTIVATION_UPLOAD_FICHIERS.md"
echo ""

read -p "Avez-vous créé le bucket 'attachments' ? (o/n) " bucket_done
read -p "Avez-vous exécuté le script SQL ? (o/n) " sql_done

if [ "$bucket_done" = "o" ] && [ "$sql_done" = "o" ]; then
    echo ""
    echo "🚀 Configuration terminée ! Redémarrez le serveur avec : npm run dev"
    echo ""
    echo "✅ Vous pouvez maintenant :"
    echo "   - Uploader des fichiers lors de la création de tâches"
    echo "   - Voir les fichiers liés sous chaque tâche (icône 📎)"
    echo "   - Prévisualiser et ouvrir les fichiers"
    echo ""
else
    echo ""
    echo "⚠️  Complétez les étapes manquantes puis relancez ce script"
    echo ""
fi
