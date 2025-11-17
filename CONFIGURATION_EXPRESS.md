# ⚡ Configuration Express - 2 Minutes

## 🎯 Situation Actuelle
L'application fonctionne mais certaines fonctionnalités de fichiers nécessitent une configuration Supabase.

## 🚀 Solution Rapide (2 étapes)

### 1️⃣ Exécuter dans Supabase SQL Editor
**Copier ce code → Supabase Dashboard → SQL Editor → Coller → RUN ▶️**

```sql
-- Table pour les fichiers de tâches
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

create policy if not exists tasks_files_all on public.tasks_files for all to authenticated using (true) with check (true);

-- Fonction pour rafraîchir le cache
create or replace function public.refresh_schema_cache()
returns void language sql security definer
as $$ select pg_notify('pgrst', 'reload schema'); $$;

grant execute on function public.refresh_schema_cache() to authenticated, anon;

-- Exécution immédiate
select public.refresh_schema_cache();
```

### 2️⃣ Créer le Bucket Storage
**Supabase Dashboard → Storage → Create Bucket**
- Name: `attachments`
- Public: ✅ Coché
- Create

---

## ✅ C'est Tout !

**Redémarrez l'application :**
- Plus d'erreurs dans la console
- Upload de fichiers fonctionnel
- Liens cliquables immédiatement

**Temps total : 2 minutes** ⏱️