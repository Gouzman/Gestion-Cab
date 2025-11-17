# Désactivation Temporaire de tasks_files et Storage

## ✅ Problèmes Résolus

Les erreurs 404 suivantes ont été éliminées :
- ❌ `Could not find the table 'public.tasks_files'` (PGRST205)
- ❌ `Bucket not found` pour le bucket 'attachments'

## 🔧 Modifications Appliquées

### 1. `/src/api/taskFiles.js`
- **Fonction `getTaskFiles()`** : Désactivée complètement
  - Ne fait plus de requête à `tasks_files`
  - Retourne immédiatement les fichiers du champ `attachments` (fallback)
  - Plus d'erreurs 404 dans la console

### 2. `/src/components/DocumentManager.jsx`
- **Requête Supabase** : Désactivée
  - Affiche un état vide en attendant la création de la table
  - Aucune erreur de console

### 3. `/src/components/TaskForm.jsx`
- **Fonction `handleDownload()`** : Désactivée
  - Affiche un toast explicatif : "Bucket non configuré"
  - Ne tente plus d'accéder au bucket Storage
- **Fonction `ensureAttachmentsBucket()`** : Supprimée (inutilisée)

### 4. `/src/lib/uploadManager.js`
- **Fonction `uploadTaskFile()`** : Désactivée
  - Retourne immédiatement une erreur explicite
  - Console warning : "Upload désactivé : bucket attachments non créé"
  - Empêche les tentatives d'upload au bucket inexistant

## 📋 État Actuel

### ✅ Fonctionnel
- ✓ Application compile sans erreurs (build réussi : 1,581.45 KB)
- ✓ Plus d'erreurs 404 dans la console
- ✓ Interface utilisateur complète (formulaires, listes, etc.)
- ✓ Système de fallback fonctionnel (champ `attachments` de la table `tasks`)

### ⏳ En Attente
- ⏳ Création de la table `tasks_files` dans Supabase
- ⏳ Création du bucket Storage `attachments`
- ⏳ Réactivation des fonctionnalités de documents

## 🚀 Prochaines Étapes (À Faire Manuellement)

### Étape 1 : Créer la Table `tasks_files`

**Dans le Supabase Dashboard → SQL Editor** :

1. Ouvrir le fichier `/sql/create_tasks_files_table_final.sql`
2. Copier tout le contenu SQL
3. Coller dans l'éditeur SQL Supabase
4. Exécuter le script

Le script contient :
- Création de la table `tasks_files`
- Colonnes : id, task_id, file_name, file_url, file_size, file_type, uploaded_by, created_at
- Index et contraintes de clés étrangères
- Politiques RLS (Row Level Security)

### Étape 2 : Créer le Bucket Storage

**Dans le Supabase Dashboard → Storage** :

1. Cliquer sur "New bucket"
2. Nom du bucket : `attachments`
3. Configuration :
   - **Public** : ✅ Coché (pour permettre les URLs publiques)
   - **File size limit** : 50 MB (recommandé)
   - **Allowed MIME types** : Laisser vide ou spécifier (pdf, images, etc.)
4. Cliquer sur "Create bucket"

### Étape 3 : Configurer les Politiques du Bucket

**Dans Storage → attachments → Policies** :

Créer 3 politiques :

1. **Lecture publique** :
   - Name : "Public read access"
   - Operation : SELECT
   - Target roles : public
   - Policy definition : `true`

2. **Upload pour utilisateurs authentifiés** :
   - Name : "Authenticated users can upload"
   - Operation : INSERT
   - Target roles : authenticated
   - Policy definition : `true`

3. **Suppression par propriétaire** :
   - Name : "Users can delete their own files"
   - Operation : DELETE
   - Target roles : authenticated
   - Policy definition : `(bucket_id = 'attachments')`

### Étape 4 : Réactiver le Code

Une fois la table et le bucket créés, réactiver les fonctionnalités :

#### 4.1 Dans `/src/api/taskFiles.js`

```javascript
export async function getTaskFiles(taskId) {
  try {
    // RÉACTIVER CETTE REQUÊTE :
    const { data: taskFiles, error: filesError } = await supabase
      .from('tasks_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.warn('Erreur lors de la récupération des fichiers :', filesError);
      // Fallback sur le champ attachments
      return getFallbackFiles(taskId);
    }

    // Vérifier l'accessibilité des URLs
    const validatedFiles = await Promise.all(
      (taskFiles || []).map(async (file) => {
        const isAccessible = await validateFileUrl(file.file_url);
        return {
          ...file,
          is_accessible: isAccessible,
          valid_url: isAccessible ? file.file_url : null
        };
      })
    );

    return {
      success: true,
      data: validatedFiles
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers :', error);
    return getFallbackFiles(taskId);
  }
}
```

#### 4.2 Dans `/src/components/DocumentManager.jsx`

```javascript
// RÉACTIVER CETTE REQUÊTE :
const { data: documents, error } = await supabase
  .from('tasks_files')
  .select(`
    *,
    tasks!inner (
      id,
      title,
      case_id
    )
  `)
  .order('created_at', { ascending: false });
```

#### 4.3 Dans `/src/lib/uploadManager.js`

Restaurer la fonction complète depuis l'historique git ou réimplémenter :

```javascript
export async function uploadTaskFile(file, taskId, userId = null) {
  try {
    // Créer le chemin : tasks/{taskId}/{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `tasks/${taskId}/${fileName}`;

    // Uploader vers Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Générer URL publique
    const { data: publicData } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;

    // Enregistrer dans tasks_files
    const fileRecord = await addTaskFile(
      taskId,
      file.name,
      publicUrl,
      file.size,
      file.type,
      userId
    );

    return {
      success: true,
      data: {
        id: fileRecord.data?.id || null,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 4.4 Dans `/src/components/TaskForm.jsx`

Restaurer la fonction `handleDownload` depuis l'historique git.

### Étape 5 : Tester

1. Créer une nouvelle tâche avec un fichier attaché
2. Vérifier que le fichier apparaît dans Storage → attachments
3. Vérifier que l'entrée apparaît dans la table tasks_files
4. Tester la prévisualisation dans la section Tasks
5. Tester l'affichage dans la section Documents

## 📊 Résumé Technique

| Composant | État | Action Requise |
|-----------|------|----------------|
| **Console** | ✅ Propre | Aucune |
| **Build** | ✅ Réussi | Aucune |
| **Table tasks_files** | ⏳ Non créée | Exécuter SQL |
| **Bucket attachments** | ⏳ Non créé | Créer via Dashboard |
| **Code UI** | ✅ Complet | Aucune |
| **Code Backend** | ⏳ Désactivé | Réactiver après infra |

## 🎯 Commande Pour Rebuild

```bash
cd /Users/gouzman/Documents/Gestion-Cab
npm run build
```

Build actuel : **1,581.45 KB** (gzip: 403.72 KB) ✅

---

**Note** : Toutes les modifications sont réversibles via git. Le code complet pour les fonctionnalités désactivées est disponible dans l'historique git pour une restauration facile une fois l'infrastructure créée.
