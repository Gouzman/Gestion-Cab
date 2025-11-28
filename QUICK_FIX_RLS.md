# ⚡ QUICK FIX - Erreur RLS Tasks

**Erreur** : `new row violates row-level security policy for table "tasks"`  
**Solution** : Exécuter les 2 scripts SQL dans l'ordre

---

## 🚀 Étapes rapides

### 1️⃣ Ajouter les colonnes
```bash
# Copier le contenu de ce fichier dans Supabase SQL Editor :
sql/add_tasks_multi_assignment_columns.sql
```

### 2️⃣ Corriger les policies RLS (OBLIGATOIRE)
```bash
# Copier le contenu de ce fichier dans Supabase SQL Editor :
sql/fix_tasks_rls_policies.sql
```

### 3️⃣ Redémarrer l'app
```bash
npm run dev
```

---

## ✅ Résultat attendu

Après exécution des 2 scripts, vous devriez pouvoir :
- ✅ Créer des tâches
- ✅ Assigner à plusieurs collaborateurs
- ✅ Définir la visibilité
- ✅ Modifier et supprimer vos tâches

---

## 🔍 Vérification

Pour vérifier que les policies sont bien créées :

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks';
```

**Résultat attendu** :
```
policyname                    | cmd
------------------------------|--------
Users can insert tasks        | INSERT
Users can view tasks          | SELECT
Users can update tasks        | UPDATE
Users can delete tasks        | DELETE
```

---

**Temps d'exécution** : < 2 minutes  
**Fichiers concernés** : 2 scripts SQL
