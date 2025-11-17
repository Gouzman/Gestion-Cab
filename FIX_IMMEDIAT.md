# ⚡ FIX IMMÉDIAT : 401 Unauthorized + Bucket

## 🎯 Vous avez ces erreurs ?

```
❌ POST .../tasks 401 (Unauthorized)
❌ new row violates row-level security policy for table "tasks"
⚠️ Le bucket 'attachments' est introuvable
```

## ✅ Solution en 1 minute

### 1. Ouvrir Supabase SQL Editor
```
https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/sql/new
```

### 2. Copier le contenu du fichier
📁 `sql/fix_all_rls_and_bucket.sql`

### 3. Cliquer sur RUN

### 4. Rafraîchir votre application

---

## ✅ C'est corrigé !

```
✅ Plus d'erreur 401
✅ Création de tâches fonctionne
✅ Upload de fichiers fonctionne
✅ Bucket attachments créé
```

---

## 📚 Fichiers disponibles

| Fichier | Description |
|---------|-------------|
| `sql/fix_all_rls_and_bucket.sql` | ⭐ **TOUT EN UN** (RECOMMANDÉ) |
| `sql/fix_tasks_rls_immediate.sql` | Uniquement RLS tasks |
| `sql/fix_tasks_files_rls_final.sql` | Uniquement RLS tasks_files |
| `FIX_TASKS_RLS_URGENT.md` | Guide détaillé |

---

**Temps : 1 minute**  
**Code applicatif : Non modifié**
