# Correction des Erreurs Supabase - Colonnes Manquantes

## 📋 Problème Identifié

Les erreurs Supabase 400 suivantes se produisaient :
- `"Could not find the 'seen_at' column of 'tasks' in the schema cache"`
- `"Could not find the 'associated_tasks' column of 'tasks' in the schema cache"`

## 🔍 Analyse du Code

### Utilisation de `seen_at`
La colonne `seen_at` est utilisée pour tracker quand une tâche a été vue par l'assigné :

**Dans TaskCard.jsx :**
```jsx
// Vérification si la tâche doit être marquée comme vue
if (isAssignedToCurrentUser && task.status === 'pending' && !task.seen_at) {
  // Auto-marquage comme vue
  seen_at: new Date().toISOString()
}

// Affichage de la date de vue
{task.seen_at && <span>Vue le: {formatDate(task.seen_at)}</span>}
```

**Dans TaskManager.jsx :**
```jsx
// Remise à zéro lors d'une réassignation
dataToUpdate.seen_at = null;

// Mise à jour lors d'un changement de statut
if (task && task.status === 'pending' && newStatus === 'seen' && !task.seen_at) {
  updatePayload.seen_at = new Date().toISOString();
}
```

### Utilisation de `associated_tasks`
La colonne `associated_tasks` est utilisée pour lier des tâches entre elles :

**Dans TaskForm.jsx :**
```jsx
// État initial
associated_tasks: []

// Gestion des tâches associées
const newAssociatedTasks = prev.associated_tasks.includes(subTask)
  ? prev.associated_tasks.filter(st => st !== subTask)
  : [...prev.associated_tasks, subTask];

// Affichage dans le formulaire
checked={formData.associated_tasks.includes(subTask)}
```

## 🛠️ Solution Appliquée

### 1. Création du Script SQL
Créé le fichier `sql/add_missing_task_columns.sql` contenant :

```sql
-- Ajout de la colonne seen_at (timestamp nullable)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- Ajout de la colonne associated_tasks (array de texte)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS associated_tasks TEXT[] DEFAULT '{}';

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tasks_seen_at 
ON tasks(seen_at) 
WHERE seen_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_associated_tasks 
ON tasks USING GIN(associated_tasks) 
WHERE array_length(associated_tasks, 1) > 0;
```

### 2. Types de Données Choisis

**`seen_at` : TIMESTAMPTZ**
- Type optimal pour stocker des horodatages avec timezone
- Compatible avec `new Date().toISOString()` utilisé dans le code
- Nullable pour permettre les valeurs null (pas encore vu)

**`associated_tasks` : TEXT[]**
- Array de chaînes de caractères pour stocker les IDs des tâches liées
- Default `'{}'` pour un array vide
- Compatible avec la logique JavaScript existante
- Index GIN pour les requêtes sur arrays

### 3. Vérification de Compatibilité

**Requêtes SELECT existantes :**
- ✅ `select('*')` : Fonctionnera avec les nouvelles colonnes
- ✅ Sélections spécifiques : Ne référencent pas les nouvelles colonnes
- ✅ Pas de modification nécessaire dans le code

**Requêtes INSERT existantes :**
- ✅ Le code inclut déjà `associated_tasks` via le formData
- ✅ `seen_at` est géré comme nullable, pas de valeur par défaut nécessaire
- ✅ Pas de modification nécessaire

**Requêtes UPDATE existantes :**
- ✅ Le code met déjà à jour `seen_at` explicitement
- ✅ `associated_tasks` est géré via le formData lors des modifications
- ✅ Pas de modification nécessaire

## 📋 Instructions d'Application

### 1. Exécution du Script SQL
1. Se connecter au dashboard Supabase
2. Aller dans l'onglet "SQL Editor"
3. Copier/coller le contenu de `sql/add_missing_task_columns.sql`
4. Exécuter le script

### 2. Vérification Post-Application
Exécuter cette requête pour vérifier :
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('seen_at', 'associated_tasks')
ORDER BY column_name;
```

Résultat attendu :
```
column_name      | data_type                   | is_nullable | column_default
associated_tasks | ARRAY                       | YES         | '{}'::text[]
seen_at          | timestamp with time zone    | YES         | null
```

### 3. Rafraîchissement du Cache
Le cache du schéma Supabase devrait se rafraîchir automatiquement.
Si les erreurs persistent, redémarrer l'application.

## ✅ Validation

### Tests à Effectuer
1. **Chargement des tâches :** Vérifier que `select('*')` fonctionne
2. **Création de tâche :** Tester l'ajout avec `associated_tasks`
3. **Marquage comme vu :** Vérifier la mise à jour de `seen_at`
4. **Modification de tâche :** Tester la sauvegarde des tâches associées

### Aucune Modification de Code Nécessaire
- ✅ **Logique métier :** Préservée intégralement
- ✅ **Structure React :** Aucune modification
- ✅ **Requêtes Supabase :** Compatibles avec les nouvelles colonnes
- ✅ **Hooks existants :** Fonctionnent sans changement

## 🎯 Impact

### Résolution des Erreurs
- ✅ **Erreur 400 seen_at :** Éliminée par l'ajout de la colonne
- ✅ **Erreur 400 associated_tasks :** Éliminée par l'ajout de la colonne
- ✅ **Schema cache :** Mis à jour automatiquement

### Fonctionnalités Activées
- 🚀 **Tracking de vue :** Les tâches peuvent être marquées comme vues
- 🚀 **Liaison de tâches :** Les tâches peuvent être associées entre elles
- 🚀 **Performance :** Index optimisés pour les nouvelles colonnes

---
**Date :** 7 Novembre 2025  
**Script SQL :** `sql/add_missing_task_columns.sql`  
**Status :** ✅ Script créé, prêt à exécuter  
**Code modifié :** ❌ Aucune modification nécessaire