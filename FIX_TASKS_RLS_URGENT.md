# 🚨 CORRECTION URGENTE : RLS table tasks

## ⚡ Problème Actuel

```
POST .../tasks 401 (Unauthorized)
Error: new row violates row-level security policy for table "tasks"
```

**Cause :** Les policies RLS de la table `tasks` bloquent l'insertion.

---

## ✅ Solution en 2 minutes

### 1️⃣ Ouvrir Supabase SQL Editor

```
https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/sql/new
```

### 2️⃣ Copier-Coller ce script

**Fichier :** `sql/fix_tasks_rls_immediate.sql`

Ou copier directement :

```sql
-- Activer RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
DROP POLICY IF EXISTS "read_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "insert_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "update_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "delete_tasks_auth" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.tasks;

-- Créer nouvelles policies
CREATE POLICY "Allow select for authenticated users"
  ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON public.tasks FOR DELETE TO authenticated USING (true);

-- Vérifier
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks';
```

### 3️⃣ Cliquer sur **RUN**

---

## ✅ Vérification

**Rafraîchir votre application et créer une tâche.**

**Dans la console :**
```
✅ POST .../tasks 200 OK
```

**Plus d'erreur 401 (Unauthorized) !**

---

## ⚠️ Note sur le bucket 'attachments'

Le warning sur le bucket est **non bloquant**. Pour le corriger :

### Option 1 : Création Manuelle (RECOMMANDÉE)

1. Ouvrir **Supabase Dashboard > Storage**
2. Cliquer sur **New bucket**
3. Nom : `attachments`
4. Cocher **Public bucket**
5. Cliquer sur **Create bucket**

### Option 2 : Via SQL

```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Créer les policies Storage
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'attachments');
```

---

## 🎯 Résultat Attendu

Après correction :

```
✅ Création de tâches → OK
✅ Plus d'erreur 401 → OK
✅ Bucket attachments → OK (si créé)
✅ Upload fichiers → OK (si bucket créé)
```

---

## 🚨 Important

**✅ Aucune modification du code React/JS**  
**✅ Seules les policies RLS de Supabase ont été corrigées**  
**✅ Le code applicatif reste intact**

---

**Temps de correction : 2 minutes**
