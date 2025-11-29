# 📋 Guide : Catégories de Documents dans les Tâches

## 🎯 Objectif

Permettre la sélection d'une catégorie obligatoire lors de l'ajout d'un document à une tâche, et afficher cette catégorie dans l'interface.

## ✅ Fonctionnalités Implémentées

### 1️⃣ Sélection de Catégorie dans TaskForm

**Emplacement** : `src/components/TaskForm.jsx`

- ✅ Champ de sélection obligatoire avant l'upload de fichiers
- ✅ 5 catégories juridiques disponibles :
  - Documents de suivi et facturation
  - Pièces
  - Écritures
  - Courriers
  - Observations et notes
- ✅ Validation : impossible d'ajouter un fichier sans catégorie
- ✅ Affichage de la catégorie sous chaque fichier en attente

### 2️⃣ Enregistrement de la Catégorie

**Emplacement** : `src/api/taskFiles.js`

- ✅ Colonne `document_category` ajoutée au payload
- ✅ Synchronisation avec `case_id` pour les dossiers
- ✅ Index créé pour améliorer les performances

**Emplacement** : `src/lib/uploadManager.js`

- ✅ Fonction `uploadMultipleTaskFilesWithCategory` créée
- ✅ Passage de la catégorie à `addTaskFile`

### 3️⃣ Affichage dans TaskManager

**Emplacement** : `src/components/TaskManager.jsx`

- ✅ Badge de catégorie affiché sous chaque fichier
- ✅ Badge bleu pour les documents catégorisés
- ✅ Badge gris avec "Non classé" pour les anciens documents
- ✅ Gestion des fichiers avec catégorie lors de la création/édition

### 4️⃣ Affichage dans DocumentManager

**Emplacement** : `src/components/DocumentManager.jsx`

- ✅ Catégorie affichée sous le nom du document
- ✅ Badge bleu pour les documents catégorisés
- ✅ "Non classé" affiché pour les documents sans catégorie

## 📁 Structure de la Base de Données

### Table `tasks_files`

```sql
CREATE TABLE public.tasks_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  document_category text,  -- ✅ Catégorie du document
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_tasks_files_document_category 
ON public.tasks_files(document_category);
```

## 🔄 Flux d'Utilisation

### Scénario 1 : Ajout de Document à une Nouvelle Tâche

1. **Utilisateur** ouvre le formulaire de création de tâche
2. **Utilisateur** sélectionne une catégorie dans la liste
3. **Utilisateur** clique sur "Choisir des fichiers" ou "Numériser"
4. **Fichier** est ajouté avec sa catégorie (visible dans la liste)
5. **Utilisateur** sauvegarde la tâche
6. **Système** uploade les fichiers avec leur catégorie
7. **Catégorie** est enregistrée dans `tasks_files.document_category`

### Scénario 2 : Ajout de Document à une Tâche Existante

1. **Utilisateur** édite une tâche existante
2. **Utilisateur** sélectionne une catégorie
3. **Utilisateur** ajoute des fichiers
4. **Système** uploade immédiatement avec la catégorie
5. **Liste des documents** se rafraîchit automatiquement

### Scénario 3 : Consultation des Documents

1. **Utilisateur** ouvre l'onglet "Documents"
2. **Système** affiche tous les documents avec leur catégorie
3. **Badge** coloré indique la catégorie (ou "Non classé")

## 🧪 Tests à Effectuer

### Test 1 : Validation de Catégorie Obligatoire

```
✅ Essayer d'ajouter un fichier sans sélectionner de catégorie
→ Message d'erreur "Catégorie requise"
```

### Test 2 : Upload avec Catégorie

```
1. Créer une nouvelle tâche
2. Sélectionner "Pièces" comme catégorie
3. Ajouter un fichier "contrat.pdf"
4. Sauvegarder la tâche
→ Fichier uploadé avec catégorie "Pièces"
→ Badge "🏷️ Pièces" visible dans TaskManager
```

### Test 3 : Affichage dans Documents

```
1. Aller dans l'onglet "Documents"
2. Vérifier que le fichier uploadé apparaît
→ Catégorie "Pièces" affichée sous le nom
→ Badge bleu avec point rond
```

### Test 4 : Documents sans Catégorie

```
1. Vérifier les anciens documents (uploadés avant cette modification)
→ Badge gris avec "Non classé" affiché
```

## 🔍 Vérification en Base de Données

### Vérifier la colonne existe

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'tasks_files' 
AND column_name = 'document_category';
```

**Résultat attendu** :
```
column_name       | data_type
document_category | text
```

### Vérifier les documents avec catégorie

```sql
SELECT 
  file_name, 
  document_category,
  created_at
FROM tasks_files
WHERE document_category IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Compter par catégorie

```sql
SELECT 
  COALESCE(document_category, 'Non classé') as category,
  COUNT(*) as total
FROM tasks_files
GROUP BY document_category
ORDER BY total DESC;
```

## 📝 Migration SQL

Si la colonne `document_category` n'existe pas encore, exécuter :

```bash
# Dans Supabase Dashboard > SQL Editor
sql/add_document_category_to_tasks_files.sql
```

## 🎨 Catégories Disponibles

Les 5 catégories juridiques sont définies dans `TaskForm.jsx` :

```javascript
const documentCategories = [
  { value: 'Documents de suivi et facturation', label: 'Documents de suivi et facturation' },
  { value: 'Pièces', label: 'Pièces' },
  { value: 'Écritures', label: 'Écritures' },
  { value: 'Courriers', label: 'Courriers' },
  { value: 'Observations et notes', label: 'Observations et notes' }
];
```

## 🔧 Maintenance

### Ajouter une Nouvelle Catégorie

1. Modifier le tableau `documentCategories` dans `TaskForm.jsx`
2. Aucune modification SQL requise (champ `text` libre)
3. Redémarrer le serveur : `npm run dev`

### Modifier l'Affichage

**Badge dans TaskManager** : Ligne 1418-1425 de `TaskManager.jsx`  
**Badge dans DocumentManager** : Ligne 513-518 de `DocumentManager.jsx`

## ✅ Checklist de Conformité

- [x] Catégorie obligatoire lors de l'ajout de fichiers
- [x] 5 catégories juridiques disponibles
- [x] Validation avant upload
- [x] Enregistrement en base dans `document_category`
- [x] Affichage dans TaskManager avec badge
- [x] Affichage dans DocumentManager avec badge
- [x] "Non classé" pour les documents sans catégorie
- [x] Synchronisation bidirectionnelle préservée
- [x] Index créé pour performance

## 🚀 Prochaines Améliorations

### Filtrage par Catégorie
Ajouter des boutons de filtre dans DocumentManager pour afficher uniquement une catégorie.

### Statistiques
Afficher le nombre de documents par catégorie dans un dashboard.

### Migration de Masse
Script pour attribuer une catégorie par défaut aux anciens documents.

## 📞 Support

En cas de problème :
1. Vérifier que la colonne existe : voir section "Vérification en Base de Données"
2. Vérifier les logs du navigateur (F12 > Console)
3. Vérifier les erreurs Supabase dans le Dashboard

---

✅ **Implémentation terminée le 29 novembre 2025**
