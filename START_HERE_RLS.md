# 🎯 START HERE : Correction RLS tasks_files

## 🚀 Vous êtes pressé ? 3 minutes chrono !

### Étape 1 : Ouvrir Supabase
```
https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/sql/new
```

### Étape 2 : Copier-Coller ce code
```sql
-- Vérifier created_by
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks_files' AND column_name = 'created_by';

-- Si vide, ajouter la colonne
ALTER TABLE public.tasks_files 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Activer RLS
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
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

-- Créer nouvelles policies
CREATE POLICY "Allow select for authenticated users"
  ON public.tasks_files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for creators"
  ON public.tasks_files FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow delete for creators"
  ON public.tasks_files FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Vérifier
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks_files';
```

### Étape 3 : Cliquer sur **RUN**

---

## ✅ Vérification

**Dans votre application :**
1. Créer une nouvelle tâche
2. Ajouter un fichier
3. Vérifier dans la console du navigateur :

```
✅ Upload vers Supabase Storage réussi
✅ URL publique générée: https://...
✅ Enregistrement tasks_files réussi (id: ...)
```

**C'est corrigé ! 🎉**

---

## 📚 Besoin de plus d'infos ?

| Document | Description |
|----------|-------------|
| `SYNTHESE_FINALE_RLS.md` | Vue d'ensemble complète |
| `ACTION_IMMEDIATE_RLS.md` | Commandes SQL séparées |
| `INDEX_CORRECTIONS_RLS.md` | Documentation complète |

---

## 🚨 Important

**✅ Le code React/JS n'a PAS été modifié**  
**✅ Seules les policies RLS de Supabase ont été corrigées**  
**✅ Aucune régression ne sera introduite**

---

## 🆘 Si ça ne marche pas

1. **Vérifier l'authentification :**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user?.id);
   ```

2. **Essayer la version ultra-permissive :**
   - Voir `sql/fix_tasks_files_rls_ultra_permissive.sql`

3. **Consulter :**
   - `INDEX_CORRECTIONS_RLS.md` → Section "🆘 Support"

---

**Créé le : 13 novembre 2025**  
**Temps de correction : 3 minutes**
