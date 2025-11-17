# 🎯 ACTION IMMÉDIATE : 3 Commandes SQL

## 1️⃣ Vérifier la colonne created_by

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks_files' 
  AND column_name = 'created_by';
```

**Si vide :**
```sql
ALTER TABLE public.tasks_files 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

## 2️⃣ Supprimer anciennes policies

```sql
DROP POLICY IF EXISTS "tasks_files_select_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_insert_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_update_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_delete_policy" ON public.tasks_files;
DROP POLICY IF EXISTS "read_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "insert_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "update_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "delete_tasks_files_auth" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_select" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_insert" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_update" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_delete" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_all" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_select" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_insert" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_update" ON public.tasks_files;
DROP POLICY IF EXISTS "tasks_files_allow_all_delete" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow insert for creators" ON public.tasks_files;
DROP POLICY IF EXISTS "Allow delete for creators" ON public.tasks_files;
```

---

## 3️⃣ Créer nouvelles policies

```sql
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authenticated users"
  ON public.tasks_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for creators"
  ON public.tasks_files
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow delete for creators"
  ON public.tasks_files
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
```

---

## ✅ Vérification

```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks_files';
```

**Résultat attendu :**
```
Allow select for authenticated users | SELECT
Allow insert for creators | INSERT
Allow delete for creators | DELETE
```

---

## 🎯 Tester

**Créer une tâche avec un fichier**

**Console du navigateur :**
```
✅ Upload vers Supabase Storage réussi
✅ URL publique générée
✅ Enregistrement tasks_files réussi
```

---

## 📁 Ou utiliser le script complet

**Ouvrir :** `sql/fix_tasks_files_rls_final.sql`  
**Copier tout** → Supabase Dashboard > SQL Editor  
**Cliquer sur :** Run

---

**C'est tout ! ✅**
