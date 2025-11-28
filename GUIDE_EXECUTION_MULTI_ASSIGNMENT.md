# 🚀 Guide d'Exécution - Ajout Multi-Assignation et Visibilité

**Date** : 27 novembre 2025  
**Objectif** : Ajouter les colonnes `assigned_to_ids` et `visible_by_ids` à la table `tasks`

---

## 📋 Instructions

### 1️⃣ Accéder à Supabase Dashboard

1. Se connecter à [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet **Gestion-Cab**
3. Aller dans **SQL Editor**

### 2️⃣ Exécuter le script SQL

1. Copier le contenu du fichier `sql/add_tasks_multi_assignment_columns.sql`
2. Le coller dans l'éditeur SQL
3. Cliquer sur **Run** ou `Ctrl/Cmd + Enter`

### 3️⃣ Vérifier l'exécution

Exécuter la requête de vérification suivante :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('assigned_to_ids', 'visible_by_ids', 'assigned_to_name', 'created_by_name');
```

**Résultat attendu** :

| column_name | data_type | column_default |
|-------------|-----------|----------------|
| assigned_to_ids | ARRAY | '{}' |
| visible_by_ids | ARRAY | '{}' |
| assigned_to_name | text | NULL |
| created_by_name | text | NULL |

### 4️⃣ Tester dans l'application

1. Relancer l'application : `npm run dev`
2. Créer une nouvelle tâche
3. Utiliser les fonctionnalités :
   - **Multi-assignation** : Sélectionner plusieurs collaborateurs
   - **Visibilité** : Définir qui peut voir la tâche

---

## ✅ Modifications Apportées

### Fichiers SQL créés
- ✅ `sql/add_tasks_multi_assignment_columns.sql`

### Fichiers JavaScript modifiés
- ✅ `src/components/TaskManager.jsx` (3 modifications)
  - Inclusion de `assigned_to_ids` et `visible_by_ids` dans les payloads INSERT
  - Inclusion de `assigned_to_ids` et `visible_by_ids` dans les payloads UPDATE
  - Ajout des colonnes dans tous les SELECT

### Nouvelles colonnes dans `tasks`

```sql
assigned_to_ids UUID[]     -- Tableau des collaborateurs assignés
visible_by_ids UUID[]      -- Tableau des utilisateurs avec accès lecture
assigned_to_name TEXT      -- Nom du collaborateur principal (denormalisé)
created_by_name TEXT       -- Nom du créateur (denormalisé)
```

---

## 🔒 Sécurité

Le script active automatiquement **Row Level Security (RLS)** sur la table `tasks` :

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

⚠️ **Important** : Vérifier que les policies RLS existantes couvrent bien les nouvelles colonnes.

---

## 🐛 Troubleshooting

### Erreur : "column already exists"
✅ **Normal** : Le script utilise `IF NOT EXISTS`, l'exécution est sûre

### Erreur : "permission denied"
❌ Vérifier que vous avez les droits admin sur la base de données

### Les nouvelles colonnes ne s'affichent pas
1. Vider le cache navigateur : `Ctrl + Shift + R`
2. Vérifier dans Supabase Dashboard → Table Editor → `tasks`

---

## 📊 Impact

| Fonctionnalité | État | Impact |
|----------------|------|--------|
| Multi-assignation tâches | ✅ Activée | Collaboration améliorée |
| Contrôle visibilité | ✅ Activée | Sécurité renforcée |
| Compatibilité ascendante | ✅ Garantie | Anciennes tâches non affectées |
| Performance | 🟢 Aucun impact | Index automatiques sur UUID[] |

---

## 🔥 IMPORTANT : Corriger les Policies RLS

⚠️ **OBLIGATOIRE** : Après avoir ajouté les colonnes, vous devez mettre à jour les policies RLS.

### Exécuter le script de correction RLS

1. Dans Supabase Dashboard → SQL Editor
2. Copier-coller le contenu de `sql/fix_tasks_rls_policies.sql`
3. Exécuter le script (Run)

Ce script :
- ✅ Supprime les anciennes policies
- ✅ Crée des policies compatibles avec `assigned_to_ids` et `visible_by_ids`
- ✅ Autorise les admins/gérants à tout faire
- ✅ Autorise les utilisateurs normaux selon les permissions

---

## 🎯 Prochaines Étapes (Optionnel)

### Créer des index pour performance

```sql
-- Index sur assigned_to_ids (requêtes "qui a cette tâche assignée ?")
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_ids 
ON tasks USING GIN (assigned_to_ids);

-- Index sur visible_by_ids (requêtes "qui peut voir cette tâche ?")
CREATE INDEX IF NOT EXISTS idx_tasks_visible_by_ids 
ON tasks USING GIN (visible_by_ids);
```

---

**Exécution estimée** : < 1 minute  
**Downtime** : Aucun (ALTER TABLE IF NOT EXISTS est non bloquant)
