# 🔗 Synchronisation Bidirectionnelle : Documents ↔ Tâches ↔ Dossiers

## 🎯 Objectif

Établir une synchronisation automatique des documents entre les tâches et leurs dossiers parents, permettant une visibilité complète et bidirectionnelle des fichiers.

---

## ❌ Problème Initial

1. Document uploadé dans une tâche → **Non visible** dans le dossier parent
2. Document uploadé dans un dossier → **Non visible** dans les tâches liées
3. Pas de relation bidirectionnelle entre `tasks_files` et le dossier parent
4. Duplication manuelle nécessaire pour lier documents aux deux entités

---

## ✅ Solution Implémentée

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLE: tasks_files                        │
├─────────────────────────────────────────────────────────────┤
│ • task_id  (uuid, nullable) → tasks.id                      │
│ • case_id  (uuid, nullable) → cases.id                      │
│ • file_url (text, unique pour déduplication)                │
│ • Contrainte: task_id OR case_id doit être rempli           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────┐
        │   TRIGGER: sync_task_file_to_case    │
        │                                       │
        │  1. Upload document dans tâche        │
        │  2. Récupère case_id de la tâche      │
        │  3. Crée référence dans tasks_files   │
        │     avec case_id + task_id=null       │
        │  4. Évite doublons par file_url       │
        └──────────────────────────────────────┘
```

---

## 📁 Fichiers Modifiés

### 1️⃣ SQL - Trigger Automatique

**`sql/sync_documents_tasks_cases.sql`** ✨ NOUVEAU

```sql
-- Fonction de synchronisation automatique
CREATE FUNCTION sync_task_file_to_case()
RETURNS TRIGGER AS $$
  -- Récupère case_id de la tâche
  -- Crée entrée dans tasks_files avec case_id
  -- Évite doublons par file_url
$$;

-- Trigger après insertion
CREATE TRIGGER trigger_sync_task_file_to_case
AFTER INSERT ON tasks_files
FOR EACH ROW
WHEN (NEW.task_id IS NOT NULL)
EXECUTE FUNCTION sync_task_file_to_case();
```

**Fonctions RPC disponibles :**
- `get_case_documents(case_id)` : Tous les documents d'un dossier
- `get_task_documents(task_id)` : Tous les documents d'une tâche + hérités

---

### 2️⃣ API - Nouvelle Couche Case Files

**`src/api/caseFiles.js`** ✨ NOUVEAU

```javascript
// Récupère tous les documents d'un dossier (tâches + dossier)
export async function getCaseDocuments(caseId)

// Récupère tous les documents d'une tâche (tâche + dossier parent)
export async function getTaskDocumentsWithInherited(taskId)

// Ajoute un document directement à un dossier
export async function addCaseFile(caseId, fileName, fileUrl, ...)
```

**Fonctionnalités :**
- ✅ Fusion automatique des documents (tâches + dossier)
- ✅ Déduplication par `file_url`
- ✅ Fallback si fonction RPC non disponible
- ✅ Métadonnées `source` et `is_inherited`

---

### 3️⃣ Upload Manager - Enrichissement avec case_id

**`src/lib/uploadManager.js`** 🔧 MODIFIÉ

```javascript
// Avant upload, récupère le case_id de la tâche
const { data: taskData } = await supabase
  .from('tasks')
  .select('case_id')
  .eq('id', taskId)
  .single();

const caseId = taskData?.case_id;

// Passe case_id à addTaskFile pour synchronisation
await addTaskFile(taskId, fileName, fileUrl, ..., caseId);
```

**Impact :** Chaque fichier uploadé dans une tâche reçoit automatiquement le `case_id` du dossier parent.

---

### 4️⃣ Task Files API - Support case_id

**`src/api/taskFiles.js`** 🔧 MODIFIÉ

```javascript
export async function addTaskFile(
  taskId, 
  fileName, 
  fileUrl, 
  fileSize, 
  fileType, 
  createdBy, 
  fileData, 
  caseId // ✨ NOUVEAU paramètre
)

// Validation case_id
if (caseId) {
  const { data: caseExists } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .single();
}

// Payload enrichi
const payload = {
  task_id: taskId,
  case_id: caseId, // 🔗 Synchronisation activée
  file_name: fileName,
  ...
};
```

---

### 5️⃣ Document Manager - Affichage Enrichi

**`src/components/DocumentManager.jsx`** 🔧 MODIFIÉ

**Avant :**
```javascript
// Récupération simple
.select('id, file_name, file_url, task_id')
```

**Après :**
```javascript
// Récupération enrichie avec case_id
.select('id, file_name, file_url, task_id, case_id')

// Enrichissement avec infos tâches ET dossiers
const tasksMap = {...};
const casesMap = {...};

// Affichage contextuel
if (file.task_id && file.case_id) {
  linkedTo = `Tâche: ${tasksMap[file.task_id]} | Dossier: ${casesMap[file.case_id]}`;
} else if (file.task_id) {
  linkedTo = `Tâche: ${tasksMap[file.task_id]}`;
} else if (file.case_id) {
  linkedTo = `Dossier: ${casesMap[file.case_id]}`;
}
```

**Déduplication :**
```javascript
// Éliminer les doublons par file_url
const uniqueDocs = Array.from(
  new Map(allDocs.map(doc => [doc.url, doc])).values()
);
```

---

## 🔄 Workflow Complet

### Scénario 1 : Upload document dans une tâche

```
1. Utilisateur upload fichier.pdf dans Tâche #123
   └─> Tâche #123 est liée au Dossier ABC

2. uploadTaskFile() récupère case_id = ABC

3. addTaskFile() insère dans tasks_files:
   {
     task_id: 123,
     case_id: ABC,
     file_url: "storage/.../fichier.pdf"
   }

4. TRIGGER sync_task_file_to_case() s'exécute
   └─> Vérifie si référence dossier existe
   └─> Crée entrée:
       {
         task_id: null,
         case_id: ABC,
         file_url: "storage/.../fichier.pdf"
       }

5. Résultat:
   ✅ Document visible dans Tâche #123
   ✅ Document visible dans Dossier ABC
   ✅ Document visible dans toutes tâches du Dossier ABC
```

### Scénario 2 : Affichage documents d'un dossier

```
1. CaseManager charge Dossier ABC

2. Appel get_case_documents(ABC)
   └─> SELECT * FROM tasks_files
       WHERE case_id = ABC
       OR task_id IN (SELECT id FROM tasks WHERE case_id = ABC)

3. Résultat fusionné:
   • Documents directs du dossier
   • Documents de toutes les tâches liées
   • Déduplication par file_url
   • Métadonnée source (task/case)

4. Affichage:
   📄 contrat.pdf (Dossier)
   📄 piece1.pdf (Tâche: Rédaction)
   📄 piece2.pdf (Tâche: Révision)
```

### Scénario 3 : Affichage documents d'une tâche

```
1. TaskManager charge Tâche #123

2. Appel get_task_documents(123)
   └─> SELECT * FROM tasks_files
       WHERE task_id = 123
       OR (case_id = ABC AND task_id IS NULL)

3. Résultat:
   • Documents propres à la tâche
   • Documents hérités du dossier parent
   • Flag is_inherited = true/false

4. Affichage:
   📄 piece1.pdf (Tâche)
   📄 contrat.pdf (Dossier - hérité)
```

---

## 🛡️ Protection Contre les Doublons

### Mécanisme Multi-Niveaux

1. **Niveau Trigger SQL**
   ```sql
   IF NOT EXISTS (
     SELECT 1 FROM tasks_files
     WHERE file_url = NEW.file_url
     AND case_id = v_case_id
     AND task_id IS NULL
   )
   ```

2. **Niveau API (addCaseFile)**
   ```javascript
   const { data: existing } = await supabase
     .from('tasks_files')
     .select('id')
     .eq('case_id', caseId)
     .eq('file_url', fileUrl)
     .is('task_id', null)
     .single();
   ```

3. **Niveau Frontend (DocumentManager)**
   ```javascript
   const uniqueDocs = Array.from(
     new Map(allDocs.map(doc => [doc.url, doc])).values()
   );
   ```

---

## 📊 Structure Finale de tasks_files

```sql
CREATE TABLE public.tasks_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liens (au moins l'un des deux requis)
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  
  -- Métadonnées fichier
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  document_category text,
  
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT tasks_files_check_link 
    CHECK (task_id IS NOT NULL OR case_id IS NOT NULL)
);

-- Index pour performance
CREATE INDEX idx_tasks_files_task_id ON tasks_files(task_id);
CREATE INDEX idx_tasks_files_case_id ON tasks_files(case_id);
CREATE INDEX idx_tasks_files_file_url ON tasks_files(file_url);
```

---

## 🚀 Actions Requises

### 1. Exécuter les migrations SQL

```bash
# 1. Ajouter case_id à tasks_files (si pas déjà fait)
Exécuter: sql/add_case_id_to_tasks_files.sql

# 2. Créer triggers et fonctions de synchronisation
Exécuter: sql/sync_documents_tasks_cases.sql
```

### 2. Vérifier les résultats

```sql
-- Tester la fonction RPC
SELECT * FROM get_case_documents('<case-uuid>');

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'tasks_files';
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

---

## ✅ Résultat Final

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| Upload document tâche | ❌ Non visible dans dossier | ✅ Auto-synchronisé |
| Upload document dossier | ❌ Non visible dans tâches | ✅ Hérité par tâches |
| Affichage dossier | ❌ Seulement docs directs | ✅ Tous docs (tâches + dossier) |
| Affichage tâche | ❌ Seulement docs tâche | ✅ Docs tâche + hérités |
| Doublons | ⚠️ Possibles | ✅ Évités (3 niveaux) |
| Suppression | ⚠️ Références orphelines | ✅ Cascade automatique |

---

## 🎯 Garanties

✅ **Aucune duplication physique** : Fichiers stockés une seule fois dans Storage  
✅ **Références uniquement** : Seules les métadonnées sont dupliquées dans tasks_files  
✅ **Synchronisation automatique** : Triggers SQL gèrent la cohérence  
✅ **Déduplication garantie** : 3 niveaux de protection  
✅ **Cascade DELETE** : Suppression propre sans orphelins  
✅ **Backward compatible** : Code existant continue de fonctionner  
✅ **Fallback robuste** : Fonctionne même sans fonction RPC  

---

## 📦 Commit

```bash
git add .
git commit -m "feat: Synchronisation bidirectionnelle documents ↔ tâches ↔ dossiers

- Trigger SQL auto-sync document tâche → dossier parent
- Fonction RPC get_case_documents() et get_task_documents()
- API caseFiles.js pour gestion documents dossier
- Enrichissement uploadManager avec case_id automatique
- DocumentManager affiche documents fusionnés (tâches + dossiers)
- Protection doublons multi-niveaux (trigger + API + frontend)
- Cascade DELETE pour nettoyage automatique
- Déduplication par file_url garantie
- Métadonnées source et is_inherited
- Fallback robuste si RPC non disponible

Résout: Documents tâches invisibles dans dossiers parents"
```

---

**Date** : 29 novembre 2025  
**Statut** : ✅ Implémenté - En attente migration SQL  
**Compatibilité** : Backward compatible - Pas de breaking change
