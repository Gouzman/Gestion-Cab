# 🔧 Corrections : Affichage Catégories & Synchronisation Bidirectionnelle

## 🎯 Problèmes Résolus

### 1️⃣ Affichage des Catégories dans DocumentManager ✅

**Problème** : Les catégories étaient stockées en base mais pas affichées

**Solution** : Ajout de l'affichage de la catégorie sous le nom du fichier

```jsx
<td className="p-4">
  <div className="text-white font-medium">{doc.name}</div>
  {doc.category && (
    <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
      {doc.category}
    </div>
  )}
</td>
```

**Fichier modifié** : `src/components/DocumentManager.jsx`

---

### 2️⃣ Affichage des Catégories dans TaskManager ✅

**Problème** : Les catégories n'apparaissaient pas dans les fichiers attachés aux tâches

**Solution** : Ajout de l'affichage de la catégorie avec badge bleu à côté de la taille du fichier

```jsx
<div className="flex items-center gap-2 mt-1">
  {file.file_size && (
    <span className="text-xs text-slate-500">
      {Math.round(file.file_size / 1024)} KB
    </span>
  )}
  {file.document_category && (
    <span className="text-xs text-blue-400 flex items-center gap-1">
      <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
      {file.document_category}
    </span>
  )}
</div>
```

**Fichier modifié** : `src/components/TaskManager.jsx`

---

### 3️⃣ Synchronisation Bidirectionnelle Documents ↔ Tâches ✅

**Problème** : 
- Document transféré depuis Documents → Tâche : ✔️ visible dans tâche
- MAIS : ❌ Pas visible dans Documents du dossier associé
- Document uploadé dans tâche : ❌ Pas visible dans Documents

**Solution** : Nouvelle fonction `transferDocumentToTask()` avec synchronisation automatique

```javascript
export async function transferDocumentToTask(documentId, taskId) {
  // 1. Récupère le document source avec sa catégorie
  const sourceDoc = await supabase
    .from('tasks_files')
    .select('*')
    .eq('id', documentId)
    .single();

  // 2. Récupère case_id de la tâche
  const taskData = await supabase
    .from('tasks')
    .select('id, case_id')
    .eq('id', taskId)
    .single();

  // 3. Crée nouvelle entrée liée à task_id ET case_id
  const newEntry = {
    task_id: taskId,
    case_id: taskData.case_id, // 🔗 Synchronisation automatique
    file_name: sourceDoc.file_name,
    file_url: sourceDoc.file_url,
    file_size: sourceDoc.file_size,
    file_type: sourceDoc.file_type,
    document_category: sourceDoc.document_category, // ✅ Catégorie préservée
    created_by: sourceDoc.created_by
  };

  return await supabase.from('tasks_files').insert(newEntry);
}
```

**Fichier modifié** : `src/api/caseFiles.js`

---

## 📋 Flux de Synchronisation

### Scénario 1 : Upload Document dans Tâche

```
1. Upload fichier.pdf dans Tâche #123
   └─> Tâche #123 liée au Dossier ABC

2. uploadTaskFile() récupère case_id = ABC (déjà implémenté)

3. Insertion dans tasks_files:
   {
     task_id: 123,
     case_id: ABC,           ← Synchronisation automatique
     file_url: "...",
     document_category: "Pièces"  ← Catégorie préservée
   }

4. Trigger SQL sync_task_file_to_case() crée référence dossier:
   {
     task_id: null,
     case_id: ABC,
     file_url: "...",
     document_category: "Pièces"  ← Catégorie copiée
   }

5. ✅ Document visible dans:
   • Tâche #123 (avec catégorie)
   • Documents du Dossier ABC (avec catégorie)
   • Toutes tâches du Dossier ABC (hérité)
```

### Scénario 2 : Transfert Document → Tâche

```
1. Document doc-123 dans DocumentManager
   └─> Lié au Dossier ABC
   └─> Catégorie: "Courriers"

2. transferDocumentToTask(doc-123, task-456)

3. Vérification:
   • Tâche 456 existe ?
   • Tâche 456.case_id = XYZ ?
   • Document déjà lié ?

4. Création nouvelle entrée:
   {
     task_id: 456,
     case_id: XYZ,           ← Dossier de la tâche
     file_url: "...",
     document_category: "Courriers"  ← Catégorie préservée
   }

5. ✅ Document visible dans:
   • Tâche 456 (avec catégorie "Courriers")
   • Documents du Dossier XYZ (avec catégorie)
```

---

## 🗄️ Structure Finale de tasks_files

```sql
CREATE TABLE public.tasks_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liens
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  
  -- Métadonnées fichier
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  document_category text,  -- ✅ Catégorie du document
  
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT tasks_files_check_link 
    CHECK (task_id IS NOT NULL OR case_id IS NOT NULL)
);

-- Index pour performance
CREATE INDEX idx_tasks_files_document_category 
ON tasks_files(document_category);
```

---

## 📁 Fichiers Modifiés

### Frontend

1. **`src/components/DocumentManager.jsx`** 🔧
   - Ajout affichage catégorie sous nom fichier
   - Badge bleu avec point de couleur

2. **`src/components/TaskManager.jsx`** 🔧
   - Ajout affichage catégorie à côté de la taille
   - Badge bleu avec point de couleur
   - Visible pour chaque fichier attaché

### Backend/API

3. **`src/api/caseFiles.js`** ✨
   - Nouvelle fonction `transferDocumentToTask()`
   - Synchronisation automatique task_id + case_id
   - Préservation de la catégorie lors du transfert
   - Ajout paramètre `documentCategory` à `addCaseFile()`

### SQL

4. **`sql/add_document_category_to_tasks_files.sql`** ✨ NOUVEAU
   - Ajoute colonne `document_category` si manquante
   - Crée index pour performance
   - Migration sûre (DO $$ IF NOT EXISTS)

5. **`sql/sync_documents_tasks_cases.sql`** 🔧
   - Mise à jour trigger pour copier `document_category`
   - Synchronisation complète des métadonnées

---

## 🚀 Actions Requises

### 1. Exécuter les migrations SQL

```bash
# 1. Ajouter colonne document_category
Exécuter: sql/add_document_category_to_tasks_files.sql

# 2. Mettre à jour le trigger (réexécuter)
Exécuter: sql/sync_documents_tasks_cases.sql
```

### 2. Vérifier en base

```sql
-- Vérifier colonne document_category
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'tasks_files' 
AND column_name = 'document_category';

-- Vérifier index
SELECT indexname FROM pg_indexes
WHERE tablename = 'tasks_files'
AND indexname = 'idx_tasks_files_document_category';
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

### 4. Tests Manuels

**Test 1 : Affichage catégorie dans Documents**
1. Aller dans Documents
2. ✅ VÉRIFIER : Catégorie affichée sous chaque nom de fichier (badge bleu)

**Test 2 : Affichage catégorie dans Tâches**
1. Ouvrir une tâche avec fichiers attachés
2. ✅ VÉRIFIER : Catégorie affichée à côté de la taille (badge bleu)

**Test 3 : Upload document dans tâche → visible dans Documents**
1. Créer une tâche liée à un dossier
2. Uploader un fichier avec catégorie "Pièces"
3. Aller dans Documents
4. ✅ VÉRIFIER : Fichier visible dans la liste avec catégorie "Pièces"

**Test 4 : Transférer document → tâche (FUTUR)**
1. Depuis DocumentManager, transférer un document vers une tâche
2. ✅ VÉRIFIER : Document visible dans la tâche avec catégorie
3. ✅ VÉRIFIER : Document toujours visible dans Documents

---

## ✅ Résultat Final

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| Catégorie dans Documents | ❌ Non affichée | ✅ Badge bleu sous nom |
| Catégorie dans Tâches | ❌ Non affichée | ✅ Badge bleu avec taille |
| Upload tâche → Documents | ❌ Non synchronisé | ✅ Visible automatiquement |
| Transfert Doc → Tâche | ❌ Non synchronisé | ✅ API ready (à intégrer UI) |
| Préservation catégorie | ⚠️ Aléatoire | ✅ Garantie partout |
| Synchronisation bidirectionnelle | ❌ Manuelle | ✅ Automatique (trigger SQL) |

---

## 📦 Commit

```bash
git add .
git commit -m "fix: Affichage catégories documents + sync bidirectionnelle

Frontend:
- DocumentManager: affichage catégorie badge bleu sous nom fichier
- TaskManager: affichage catégorie badge bleu avec taille fichier

API:
- Nouvelle fonction transferDocumentToTask() avec sync case_id
- Préservation document_category lors des transferts
- Paramètre documentCategory ajouté à addCaseFile()

SQL:
- Migration add_document_category_to_tasks_files.sql
- Trigger sync mis à jour pour copier document_category
- Index performance sur document_category

Résout:
- Catégories invisibles dans Documents et Tâches
- Documents tâches non visibles dans Documents dossier
- Perte catégorie lors synchronisation"
```

---

**Date** : 29 novembre 2025  
**Statut** : ✅ Implémenté - En attente migration SQL  
**Breaking Changes** : Aucun
