# 🚀 Guide d'Exécution - Correction Colonnes Supabase

## ⚡ Actions Immédiates Requises

### 1. Accéder au Dashboard Supabase
1. Se connecter sur [supabase.com](https://supabase.com)
2. Sélectionner le projet
3. Aller dans **SQL Editor** (dans la sidebar)

### 2. Exécuter le Script SQL
1. Cliquer sur **"New Query"**
2. Copier intégralement le contenu de `sql/add_missing_task_columns.sql`
3. Coller dans l'éditeur
4. Cliquer sur **"Run"** (Ctrl+Enter)

### 3. Vérification Immédiate
Exécuter cette requête de vérification :
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('seen_at', 'associated_tasks')
ORDER BY column_name;
```

**Résultat attendu :**
```
associated_tasks | ARRAY                     | YES | '{}'::text[]
seen_at         | timestamp with time zone  | YES | null
```

### 4. Test de l'Application
1. Redémarrer l'application React : `npm run dev`
2. Tester les fonctionnalités :
   - ✅ Chargement des tâches (Dashboard, TaskManager)
   - ✅ Création de nouvelle tâche (avec tâches associées)
   - ✅ Marquage d'une tâche comme vue
   - ✅ Modification de tâche existante

---

## 🎯 Résolution des Erreurs

**Avant l'application du script :**
- ❌ `Could not find the 'seen_at' column of 'tasks' in the schema cache`
- ❌ `Could not find the 'associated_tasks' column of 'tasks' in the schema cache`

**Après l'application du script :**
- ✅ Colonnes ajoutées à la table `tasks`
- ✅ Index optimisés créés
- ✅ Schema cache automatiquement mis à jour
- ✅ Erreurs 400 éliminées

---

## 📋 Checklist Post-Exécution

- [ ] Script SQL exécuté sans erreur
- [ ] Colonnes vérifiées dans information_schema
- [ ] Application redémarrée
- [ ] Test de chargement des tâches
- [ ] Test de création de tâche
- [ ] Test de marquage comme vu
- [ ] Aucune erreur 400 dans la console

---
**⏰ Durée estimée :** 2-3 minutes  
**🔧 Complexité :** Simple (juste exécution SQL)  
**⚠️ Risque :** Minimal (pas de modification de données existantes)