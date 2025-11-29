# 🔧 Correction de l'erreur Foreign Key Constraint sur tasks_files

## ❌ Problème Identifié

```
insert or update on table "tasks_files" violates foreign key constraint "fk_tasks_files_task_id"
Key (task_id) is not present in table "tasks"
```

### Cause Racine

Le champ `task_id` dans `tasks_files` était rempli avec des valeurs qui ne correspondaient pas à des IDs valides dans la table `tasks` :
- Dans `DocumentUploadModal.jsx` : `task_id` était rempli avec `formData.linked_case_id` (ID d'un dossier, pas d'une tâche)
- Pas de validation préalable de l'existence du `task_id` avant insertion

---

## ✅ Corrections Appliquées

### 1️⃣ Validation dans `addTaskFile()` - `/src/api/taskFiles.js`

**Ajout** : Vérification que `task_id` existe dans la table `tasks` avant insertion

```javascript
// VALIDATION CRITIQUE : Vérifier que task_id existe dans la table tasks
if (taskId) {
  const { data: taskExists, error: taskCheckError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .single();

  if (taskCheckError || !taskExists) {
    console.error(`❌ task_id "${taskId}" n'existe pas dans la table tasks`);
    return { 
      success: false, 
      error: { 
        message: `Le task_id "${taskId}" n'existe pas. Veuillez créer la tâche avant d'uploader des fichiers.`,
        code: 'INVALID_TASK_ID'
      } 
    };
  }
}
```

**Impact** : Empêche toute insertion avec un `task_id` invalide au niveau de la couche API.

---

### 2️⃣ Validation dans `uploadTaskFile()` - `/src/lib/uploadManager.js`

**Ajout** : Double vérification au niveau de l'upload manager

```javascript
// 0. VALIDATION CRITIQUE : Vérifier que taskId est valide
if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
  return {
    success: false,
    error: 'ID de tâche manquant. Veuillez créer la tâche avant d\'uploader des fichiers.'
  };
}

// Vérifier que la tâche existe réellement dans la base de données
const { data: taskExists } = await supabase
  .from('tasks')
  .select('id')
  .eq('id', taskId)
  .single();

if (!taskExists) {
  return {
    success: false,
    error: `La tâche n'existe pas. Veuillez enregistrer la tâche avant d'uploader des fichiers.`
  };
}
```

**Impact** : Protection supplémentaire avant tout upload vers Storage.

---

### 3️⃣ Migration SQL - Ajout de `case_id` 

**Nouveau fichier** : `/sql/add_case_id_to_tasks_files.sql`

**Modifications** :
1. Ajout de la colonne `case_id` (optionnelle, référence `cases.id`)
2. `task_id` devient optionnel (nullable)
3. Contrainte CHECK : au moins `task_id` OU `case_id` doit être rempli

```sql
ALTER TABLE public.tasks_files 
ADD COLUMN case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE;

ALTER TABLE public.tasks_files 
ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE public.tasks_files 
ADD CONSTRAINT tasks_files_check_link 
CHECK (task_id IS NOT NULL OR case_id IS NOT NULL);
```

**Impact** : Permet de lier des documents :
- À une tâche spécifique (`task_id`)
- À un dossier général (`case_id`)
- Aux deux simultanément

---

### 4️⃣ Correction dans `DocumentUploadModal.jsx`

**Avant** (❌ ERREUR) :
```javascript
const payload = {
  task_id: formData.linked_case_id || null, // ❌ ID de case, pas de task
  ...
};
```

**Après** (✅ CORRIGÉ) :
```javascript
const payload = {
  task_id: null, // Documents généraux sans tâche spécifique
  case_id: formData.linked_case_id || null, // ✅ Utilisation correcte
  ...
};
```

**Impact** : Le module Documents lie maintenant correctement les fichiers aux dossiers via `case_id`.

---

## 🎯 Validation Existante (Déjà Correcte)

### ✅ `TaskManager.jsx` - Ligne 562

Upload des fichiers **APRÈS** création de la tâche :

```javascript
const { data, error } = await supabase
  .from('tasks')
  .insert([cleanPayload])
  .single();

// Upload uniquement si la tâche existe
if (filesToUpload && filesToUpload.length > 0) {
  const uploadResult = await uploadMultipleTaskFiles(filesToUpload, data.id, currentUser?.id);
}
```

**État** : ✅ Aucune modification nécessaire

---

### ✅ `TaskForm.jsx` - Ligne 131

Validation avant upload immédiat :

```javascript
const handleImmediateUpload = async (files) => {
  if (!task?.id) {
    toast({
      variant: "destructive",
      title: "⚠️ Tâche non enregistrée",
      description: "Veuillez d'abord enregistrer la tâche avant d'ajouter des fichiers."
    });
    return;
  }
  // ...upload
}
```

**État** : ✅ Aucune modification nécessaire

---

## 📋 Actions Requises

### 1. Exécuter la migration SQL

Dans **Supabase Dashboard > SQL Editor** :

```bash
Exécuter : /sql/add_case_id_to_tasks_files.sql
```

### 2. Redémarrer le serveur dev

```bash
npm run dev
```

### 3. Tester les scénarios

#### Scénario 1 : Upload dans une tâche existante ✅
1. Créer une nouvelle tâche
2. Ajouter un fichier via "Ajouter un fichier"
3. **Résultat attendu** : Upload réussi avec `task_id` valide

#### Scénario 2 : Upload dans le module Documents ✅
1. Aller dans Documents
2. Cliquer sur "Transférer un document"
3. Sélectionner un dossier (optionnel)
4. **Résultat attendu** : Upload réussi avec `case_id` et `task_id = null`

#### Scénario 3 : Tentative d'upload sans tâche (bloqué) 🚫
1. Essayer d'uploader avec un `task_id` invalide
2. **Résultat attendu** : Erreur claire "Le task_id n'existe pas"

---

## 🔒 Garanties de Sécurité

| Niveau | Protection | Description |
|--------|-----------|-------------|
| **Base de données** | Foreign Key Constraint | `task_id` REFERENCES `tasks(id)` ON DELETE CASCADE |
| **API Layer** | Validation `addTaskFile()` | Vérification existence task avant INSERT |
| **Upload Manager** | Validation `uploadTaskFile()` | Vérification existence task avant Storage upload |
| **Frontend** | Validation `TaskForm` | Blocage UI si tâche non enregistrée |
| **Contrainte CHECK** | SQL Constraint | Au moins `task_id` OU `case_id` requis |

---

## 📊 Structure Finale de `tasks_files`

```sql
CREATE TABLE public.tasks_files (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,     -- Optionnel
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,     -- Optionnel
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  document_category text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT tasks_files_check_link 
    CHECK (task_id IS NOT NULL OR case_id IS NOT NULL)
);
```

---

## ✅ Résultat

- ✅ Aucune insertion possible avec `task_id` invalide
- ✅ Validation à 4 niveaux (DB, API, Manager, UI)
- ✅ Support des documents généraux (dossiers) via `case_id`
- ✅ Logique métier existante préservée
- ✅ Workflow d'upload sécurisé
- ✅ Messages d'erreur explicites pour l'utilisateur

---

## 🚀 Commit

```bash
git add .
git commit -m "fix: Correction contrainte foreign key tasks_files.task_id

- Ajout validation task_id existe dans addTaskFile() et uploadTaskFile()
- Migration SQL: ajout case_id optionnel pour documents généraux
- Correction DocumentUploadModal: utilisation case_id au lieu de task_id
- task_id devient optionnel avec contrainte CHECK (task_id OR case_id requis)
- Protection à 4 niveaux: DB, API, Manager, UI
- Messages d'erreur explicites si task_id invalide

Résout: insert or update on table tasks_files violates foreign key constraint"
```

---

**Date** : 29 novembre 2025
**Statut** : ✅ Corrections appliquées - En attente de migration SQL
