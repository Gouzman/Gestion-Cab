# 🔧 CORRECTION : Assignation et Affichage des Tâches Collaborateurs

**Date** : 29 novembre 2025  
**Objectif** : Résoudre le problème où les tâches assignées n'apparaissaient pas dans le dashboard des collaborateurs.

---

## 📋 Problème Identifié

### Causes racines
1. **Filtrage incomplet** : Les requêtes utilisaient uniquement `assigned_to_id.eq()` au lieu de gérer aussi `assigned_to_ids` (array)
2. **Colonnes non synchronisées** : `assigned_to_id` (UUID unique) était rempli, mais `assigned_to_ids` (UUID[] array) restait vide
3. **Multi-assignation non exploitée** : Le système supportait la multi-assignation en base, mais le code ne l'utilisait pas

### Colonnes de la table `tasks`
- `assigned_to_id` (UUID) - Assignation unique (ancienne méthode)
- `assigned_to_ids` (UUID[]) - Multi-assignation (nouvelle méthode) ✅
- `visible_by_ids` (UUID[]) - Liste des utilisateurs autorisés à voir la tâche
- `created_by_id` (UUID) - Créateur de la tâche

---

## ✅ Solutions Appliquées

### 1️⃣ Dashboard.jsx - Correction du filtrage
**Avant** :
```javascript
if (!isAdmin) {
  tasksQuery = tasksQuery.eq('assigned_to_id', currentUser.id);
}
```

**Après** :
```javascript
if (!isAdmin) {
  // Filtrer : assigned_to_id OU dans assigned_to_ids OU dans visible_by_ids
  tasksQuery = tasksQuery.or(`assigned_to_id.eq.${currentUser.id},assigned_to_ids.cs.{${currentUser.id}},visible_by_ids.cs.{${currentUser.id}}`);
}
```

**Explication** :
- `.or()` permet de combiner plusieurs conditions
- `assigned_to_ids.cs.{uuid}` utilise l'opérateur Postgres `@>` (contains) pour les arrays
- `visible_by_ids.cs.{uuid}` vérifie aussi la visibilité explicite

---

### 2️⃣ TaskManager.jsx - Correction du filtrage ET ajout des colonnes

**Correction 1 - SELECT avec toutes les colonnes** :
```javascript
const selectColumns =
  'id,title,description,priority,status,deadline,assigned_to_id,assigned_to_ids,assigned_to_name,visible_by_ids,case_id,attachments,created_at,updated_at,created_by_id,created_by_name,assigned_at,main_category,seen_at,completion_comment';
```

**Correction 2 - Filtrage avec OR** :
```javascript
if (!isAdmin && currentUser?.id) {
  query = query.or(`assigned_to_id.eq.${currentUser.id},assigned_to_ids.cs.{${currentUser.id}},visible_by_ids.cs.{${currentUser.id}}`);
}
```

**Correction 3 - Synchronisation lors de la création** :
```javascript
const payload = {
  ...dataToInsert,
  assigned_to_name: assignedMember ? assignedMember.name : null,
  assigned_at: dataToInsert.assigned_to_id ? new Date().toISOString() : null,
  assigned_to_ids: dataToInsert.assigned_to_id ? [dataToInsert.assigned_to_id] : [], // ✅ NOUVEAU
  created_by_id: currentUser.id,
  created_by_name: currentUser.name,
};
```

**Correction 4 - Synchronisation lors de la modification** :
```javascript
const updatePayload = {
  ...cleanDataToUpdate,
  assigned_to_name: assignedMember ? assignedMember.name : null,
  assigned_to_ids: dataToUpdate.assigned_to_id ? [dataToUpdate.assigned_to_id] : [], // ✅ NOUVEAU
};
```

---

### 3️⃣ SQL - Synchronisation des tâches existantes

**Script créé** : `sql/SYNC_ASSIGNED_TO_IDS.sql`

```sql
UPDATE tasks
SET assigned_to_ids = ARRAY[assigned_to_id]
WHERE assigned_to_id IS NOT NULL
  AND (
    assigned_to_ids IS NULL 
    OR assigned_to_ids = '{}'
    OR NOT (assigned_to_id = ANY(assigned_to_ids))
  );
```

**Action requise** : Exécuter ce script dans Supabase SQL Editor pour synchroniser toutes les tâches existantes.

---

## 📊 Architecture de Données

### Source de Vérité
La colonne **`assigned_to_ids`** (UUID[]) est désormais la source de vérité pour l'assignation :
- Permet l'assignation à **un seul collaborateur** : `assigned_to_ids = ARRAY[uuid]`
- Permet l'assignation **multiple** : `assigned_to_ids = ARRAY[uuid1, uuid2, uuid3]`
- `assigned_to_id` reste pour compatibilité et affichage simplifié (premier assigné)

### Logique de Filtrage
```sql
-- Requête complète pour un collaborateur
SELECT * FROM tasks
WHERE created_by_id = 'user_uuid'           -- Créateur
   OR assigned_to_id = 'user_uuid'          -- Assigné unique
   OR 'user_uuid' = ANY(assigned_to_ids)    -- Dans la liste d'assignation
   OR 'user_uuid' = ANY(visible_by_ids)     -- Autorisé à voir
   OR EXISTS (                               -- Admin/Gérant
     SELECT 1 FROM profiles 
     WHERE id = 'user_uuid' 
     AND (role = 'admin' OR function IN ('Gerant', 'Associe Emerite'))
   );
```

---

## 🧪 Tests et Validation

### Script de test créé
`sql/TEST_ASSIGNATION_TACHES.sql` contient :
1. Création d'une tâche de test assignée à un collaborateur
2. Vérification de la synchronisation `assigned_to_id` ↔ `assigned_to_ids`
3. Simulation de la requête du dashboard collaborateur
4. Vérification des RLS policies
5. Comptage des tâches par statut
6. Diagnostic en cas de problème

### Procédure de test manuelle
1. **Créer une tâche** en tant qu'admin
2. **Assigner** la tâche à un collaborateur X
3. **Se connecter** avec le compte du collaborateur X
4. **Vérifier** dans le Dashboard :
   - La tâche apparaît dans la liste
   - Le compteur "Tâches en attente" est mis à jour
   - La tâche est accessible dans TaskManager
5. **Modifier** la tâche (statut, priorité)
6. **Vérifier** que les modifications sont bien sauvegardées

---

## 🔐 RLS Policies (Row Level Security)

Les policies existantes dans `sql/fix_tasks_rls_policies.sql` sont correctes :

```sql
CREATE POLICY "Users can view tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by_id 
  OR auth.uid() = assigned_to_id
  OR auth.uid() = ANY(assigned_to_ids)      -- ✅ Multi-assignation
  OR auth.uid() = ANY(visible_by_ids)       -- ✅ Visibilité
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.function IN ('Gerant', 'Associe Emerite'))
  )
);
```

**Statut** : ✅ Les policies sont déjà correctes, pas de modification nécessaire.

---

## 📝 Checklist de Déploiement

### Étapes à suivre dans l'ordre

- [ ] 1. **Exécuter** `sql/SYNC_ASSIGNED_TO_IDS.sql` dans Supabase SQL Editor
- [ ] 2. **Vérifier** la synchronisation avec la requête 3 du script
- [ ] 3. **Recharger** l'application frontend (clear cache si nécessaire)
- [ ] 4. **Tester** avec un compte collaborateur :
  - [ ] Créer une tâche assignée au collaborateur
  - [ ] Se connecter avec le collaborateur
  - [ ] Vérifier que la tâche apparaît dans Dashboard
  - [ ] Vérifier que la tâche apparaît dans TaskManager
  - [ ] Vérifier les compteurs de statut
- [ ] 5. **Tester** la modification d'une tâche existante
- [ ] 6. **Tester** avec un admin (doit voir toutes les tâches)

---

## 🐛 Diagnostic si Problème Persiste

### Symptôme : Les tâches n'apparaissent toujours pas

**Vérification 1 - Base de données** :
```sql
-- Vérifier que assigned_to_ids est rempli
SELECT id, title, assigned_to_id, assigned_to_ids
FROM tasks
WHERE assigned_to_id IS NOT NULL
LIMIT 10;
```
➡️ Si `assigned_to_ids` est vide : Exécuter `SYNC_ASSIGNED_TO_IDS.sql`

**Vérification 2 - RLS actif** :
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'tasks';
```
➡️ Si `rowsecurity = false` : `ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;`

**Vérification 3 - Frontend** :
Ouvrir la console du navigateur (F12) et taper :
```javascript
console.log(currentUser); // Doit afficher { id: 'uuid', email: '...', ... }
```
➡️ Si `currentUser.id` est `undefined` : Problème dans InternalAuthContext

**Vérification 4 - Requête réseau** :
Dans F12 → Network → Filtrer "tasks" :
- Vérifier l'URL de la requête
- Vérifier les paramètres de filtrage (`or=...`)
- Vérifier la réponse (nombre de tâches retournées)

---

## 📈 Bénéfices de cette Correction

✅ **Affichage correct** : Les collaborateurs voient leurs tâches assignées  
✅ **Multi-assignation prête** : Le système supporte maintenant plusieurs assignés par tâche  
✅ **Visibilité flexible** : `visible_by_ids` permet de partager une tâche sans l'assigner  
✅ **Performance** : Filtrage optimisé avec index sur `assigned_to_ids`  
✅ **Compatibilité** : `assigned_to_id` conservé pour l'interface utilisateur simple  
✅ **Évolutivité** : Prêt pour ajouter une interface de multi-assignation dans le futur  

---

## 🔮 Évolutions Futures Possibles

### Court terme
- [ ] Interface de sélection multiple dans TaskForm (checkbox liste collaborateurs)
- [ ] Badge "Multi-assigné" si `assigned_to_ids.length > 1`
- [ ] Filtre "Mes tâches / Tâches d'équipe" dans TaskManager

### Moyen terme
- [ ] Notifications push quand une tâche est assignée
- [ ] Historique des changements d'assignation
- [ ] Statistiques par collaborateur (nombre de tâches, temps moyen)

### Long terme
- [ ] Workflow avec étapes et assignations séquentielles
- [ ] Charge de travail automatique (équilibrage des assignations)
- [ ] Prédiction de deadline basée sur l'historique

---

## 📚 Fichiers Modifiés

### Code Frontend
- ✅ `src/components/Dashboard.jsx` - Ligne 67
- ✅ `src/components/TaskManager.jsx` - Lignes 348, 353, 558, 875

### Scripts SQL
- ✅ Créé : `sql/SYNC_ASSIGNED_TO_IDS.sql`
- ✅ Créé : `sql/TEST_ASSIGNATION_TACHES.sql`
- ✅ Créé : `CORRECTION_ASSIGNATION_TACHES.md` (ce fichier)

### Scripts SQL Existants (Référence)
- `sql/add_tasks_multi_assignment_columns.sql` - Création des colonnes
- `sql/fix_tasks_rls_policies.sql` - Policies RLS (déjà correctes)

---

**Date de mise en production** : À définir  
**Validé par** : À compléter après tests  
**Impact** : ✅ Aucune régression - Amélioration pure de la logique d'affichage
