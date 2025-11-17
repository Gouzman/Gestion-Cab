# 🔄 Script de réactivation tasks_files

## 📋 **Instructions post-migration**

Après avoir créé la table `tasks_files` avec le script SQL, suivez ces étapes :

### 1️⃣ **Dans TaskManager.jsx - fetchTaskFiles()**

Remplacer :
```javascript
// Fonction pour récupérer les fichiers avec fallback sur attachments
const fetchTaskFiles = async (taskId, taskAttachments = null) => {
  // Essayer directement le fallback pour éviter complètement l'erreur 404
  // tant que la table n'existe pas
  return getAttachedDocuments({ attachments: taskAttachments });
  
  /* TODO: Réactiver ce code après création de la table tasks_files
  // ... code commenté
  */
};
```

Par :
```javascript
// Fonction pour récupérer les fichiers avec fallback sur attachments
const fetchTaskFiles = async (taskId, taskAttachments = null) => {
  try {
    // Essayer d'abord la table tasks_files directement
    const { data, error, status } = await supabase
      .from("tasks_files")
      .select("id, file_name, file_url, file_size, file_type, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    // Si la table n'existe pas (404/PGRST205), utiliser le fallback
    if (error && (status === 404 || error.code === "PGRST205")) {
      return getAttachedDocuments({ attachments: taskAttachments });
    }
    
    if (error) {
      return getAttachedDocuments({ attachments: taskAttachments });
    }

    // Si pas de données dans tasks_files, fallback sur attachments
    if (!data || data.length === 0) {
      return getAttachedDocuments({ attachments: taskAttachments });
    }
    
    return data;
  } catch (error) {
    // Fallback sur attachments en cas d'erreur
    return getAttachedDocuments({ attachments: taskAttachments });
  }
};
```

### 2️⃣ **Réactiver l'enregistrement dans handleFileUpload**

Décommenter :
```javascript
// Enregistrer également dans tasks_files si possible
try {
  await supabase
    .from('tasks_files')
    .insert([{
      task_id: taskId,
      file_url: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      created_by: currentUser.id
    }]);
} catch (error) {
  // Erreur silencieuse - le fichier est quand même uploadé
  console.log('Enregistrement tasks_files échoué, mais upload réussi:', error);
}
```

### 3️⃣ **Réactiver l'enregistrement dans handleScanUpload**

Remplacer la section commentée par le code d'insertion complet.

### 4️⃣ **Tester après réactivation**

```bash
# 1. Vérifier que l'API fonctionne
GET /rest/v1/tasks_files?select=*&limit=1
# Doit retourner 200 avec []

# 2. Tester l'upload
# Upload fichier → vérifier insertion dans tasks_files

# 3. Tester l'affichage
# Clic sur 📎 → fichiers depuis tasks_files
```

## 🎯 **État actuel (temporaire)**

- ✅ **Aucune erreur 404** dans la console
- ✅ **Fonctionnalité complète** avec fallback sur attachments
- ✅ **Nom de fichier** affiché correctement
- ✅ **Upload** fonctionne (storage seulement)
- 🟡 **tasks_files désactivé** jusqu'à la migration SQL

## 📅 **Planning recommandé**

1. **Maintenant** : Code déployé sans erreur 404
2. **Prochaine étape** : Exécuter le script SQL de migration
3. **Après migration** : Réactiver le code tasks_files
4. **Validation** : Tester le flux complet

Cette approche garantit zéro interruption de service.