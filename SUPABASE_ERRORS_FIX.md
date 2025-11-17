# 🔧 Correction Rapide des Erreurs Supabase

## 🎯 Problèmes à Résoudre
- ❌ "Could not find the function public.refresh_schema_cache"
- ❌ "Could not find the table 'public.tasks_files' in the schema cache"  
- ❌ "Infrastructure partiellement initialisée"
- ❌ Erreurs 404 vers `/rpc/refresh_schema_cache`

## ⚡ Solution en 2 Étapes

### 🧩 Étape 1 : Exécuter dans Supabase SQL Editor

**Copier/coller ce bloc dans Supabase Dashboard → SQL Editor → New Query :**

```sql
-- ✅ Créer la table tasks_files et la fonction de cache
create table if not exists public.tasks_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  file_type text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_tasks_files_task_id on public.tasks_files(task_id);
alter table public.tasks_files enable row level security;

-- Politiques de sécurité
create policy if not exists tasks_files_select on public.tasks_files for select to authenticated using (true);
create policy if not exists tasks_files_insert on public.tasks_files for insert to authenticated with check (true);

-- ✅ Fonction pour rafraîchir le cache PostgREST
create or replace function public.refresh_schema_cache()
returns void
language sql
security definer
as $$
  select pg_notify('pgrst', 'reload schema');
$$;

grant execute on function public.refresh_schema_cache() to authenticated;
grant execute on function public.refresh_schema_cache() to anon;

-- ✅ Exécution immédiate
select public.refresh_schema_cache();
```

**Cliquer sur RUN** ▶️

### 🧩 Étape 2 : Créer le Bucket (si pas fait)

**Dans Supabase Dashboard → Storage :**
1. **Create Bucket**
2. Name: `attachments`
3. Public: ✅ **Coché**
4. **Create**

---

## ✅ Résultats Attendus

**Après exécution, redémarrer l'app :**
```bash
npm run dev
```

**Console du navigateur (F12) :**
```
🚀 Initialisation de l'infrastructure de l'application...
✅ Base de données : Table tasks_files accessible
✅ Stockage : Bucket attachments configuré
✅ Cache Supabase rafraîchi
🎉 Infrastructure complètement initialisée !
```

**Plus d'erreurs :**
- ✅ Fini les `PGRST205`
- ✅ Fini les `404 /rpc/refresh_schema_cache`
- ✅ Fini les "Infrastructure partiellement initialisée"
- ✅ Upload de fichiers fonctionnel immédiatement

---

## 🚀 Test de Fonctionnement

1. **Créer une nouvelle tâche**
2. **Ajouter des fichiers** (drag & drop ou sélection)
3. **Sauvegarder la tâche**
4. **Vérifier** : Les fichiers sont immédiatement cliquables avec des liens verts ✅

**Message de succès attendu :**
```
✅ Fichier uploadé : "document.pdf" a été téléchargé et est maintenant accessible.
✅ Tâche créée : La nouvelle tâche a été ajoutée. 2 fichier(s) joint(s).
```

---

**🎉 Correction terminée ! L'application est maintenant stable.**