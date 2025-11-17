# 📎 Implémentation de l'indicateur de documents pour les tâches

## ✅ Fonctionnalités ajoutées

### 1️⃣ **Indicateur visuel dans la liste des tâches**
- Icône 📎 (trombone) affichée à côté du titre des tâches qui ont des documents liés
- L'icône apparaît uniquement si la tâche contient des fichiers (attachments ou fichiers numérisés)
- Clic sur l'icône pour développer/réduire l'affichage des documents

### 2️⃣ **Détection des documents à partir de 2 sources**
- **Colonne `attachments`** (table `tasks`) : fichiers joints classiques
- **Table `tasks_files`** : fichiers numérisés/scannés

### 3️⃣ **Affichage des documents liés**
- Section dépliante avec animation smooth
- Compteur total des documents : `Documents liés (X)`
- Fichiers classiques marqués avec 📎
- Fichiers numérisés marqués avec 📷
- Bouton d'ouverture pour chaque fichier

### 4️⃣ **Gestion des URL de fichiers**
- Fichiers attachments : ouverture directe si URL valide
- Fichiers numérisés : génération d'URL signée Supabase
- Message d'information si fichier en attente ou non accessible

## 🔧 Fonctions ajoutées

### `hasAttachedDocuments(task)`
```jsx
const hasAttachedDocuments = (task) => {
  const attachmentsArray = Array.isArray(task.attachments)
    ? task.attachments
    : task.attachments ? JSON.parse(task.attachments || "[]") : [];
  
  // Vérifier aussi s'il y a des fichiers dans tasks_files
  const filesCount = taskFiles[task.id]?.length || 0;
  
  return attachmentsArray.length > 0 || filesCount > 0;
};
```

### `getAttachedDocuments(task)`
```jsx
const getAttachedDocuments = (task) => {
  const attachmentsArray = Array.isArray(task.attachments)
    ? task.attachments
    : task.attachments ? JSON.parse(task.attachments || "[]") : [];
  return attachmentsArray;
};
```

### `fetchTaskFiles(taskId)`
```jsx
const fetchTaskFiles = async (taskId) => {
  try {
    const { data, error } = await supabase
      .from('tasks_files')
      .select('id, file_name, file_url, file_size, file_type, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return [];
  }
};
```

## 🎨 Interface utilisateur

### Dans la liste des tâches :
- **Avant** : `Titre de la tâche`
- **Après** : `Titre de la tâche 📎` (si documents présents)

### Vue étendue des documents :
```
Documents liés (3)
┌─────────────────────────────────┐
│ 📎 contrat_client.pdf       🔗 │
│ 📎 facture_2024.xlsx        🔗 │
│ 📷 scan_document_001.jpg    🔗 │
└─────────────────────────────────┘
```

## 🔄 Logique de chargement

1. **Au chargement initial** : Vérification des attachments dans la colonne `attachments`
2. **Au clic sur l'icône** : 
   - Développement de la section documents
   - Chargement asynchrone des fichiers depuis `tasks_files` (si pas encore chargés)
   - Mise en cache dans `taskFiles[taskId]`

## 🛡️ Gestion des erreurs

- **Fichier non accessible** : Message "Fichier en attente"
- **Erreur de parsing JSON** : Retour à un tableau vide
- **Erreur Supabase** : Log en console + array vide
- **URL signée échouée** : Toast d'information

## 📊 Impact sur les performances

- **Pas d'impact au chargement initial** : Les attachments sont déjà récupérés dans `fetchTasks()`
- **Chargement à la demande** : Les fichiers `tasks_files` ne sont chargés que si l'utilisateur étend une tâche
- **Mise en cache** : Une fois chargés, les fichiers sont mis en cache dans le state

## 🎯 Objectifs atteints

✅ **Indicateur visuel** : Icône 📎 dans la liste  
✅ **Accès rapide** : Clic pour développer la liste des documents  
✅ **Logique préservée** : Aucun impact sur les fonctionnalités existantes  
✅ **Design cohérent** : Intégration naturelle dans le layout  
✅ **Support multi-sources** : Attachments + tasks_files  
✅ **Performance optimisée** : Chargement à la demande  

## 🔧 Utilisation

1. **Voir l'indicateur** : L'icône 📎 apparaît automatiquement à côté des tâches avec documents
2. **Développer la liste** : Cliquer sur l'icône 📎
3. **Ouvrir un fichier** : Cliquer sur l'icône 🔗 à droite du nom de fichier
4. **Réduire la liste** : Cliquer à nouveau sur l'icône 📎

## 🧪 Test recommandé

1. Créer une tâche avec des fichiers joints
2. Vérifier que l'icône 📎 apparaît
3. Cliquer pour développer et voir la liste des fichiers
4. Tester l'ouverture des fichiers
5. Vérifier que les tâches sans documents n'ont pas d'icône