-- Migration SQL non destructive pour créer la table tasks_files
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- Table des fichiers liés aux tâches
create table if not exists public.tasks_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  file_type text,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Index
create index if not exists idx_tasks_files_task_id on public.tasks_files(task_id);
create index if not exists idx_tasks_files_created_at on public.tasks_files(created_at desc);

-- Activer RLS
alter table public.tasks_files enable row level security;

-- Policies lecture: tout utilisateur authentifié peut lire les fichiers des tâches
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks_files' and policyname='read_tasks_files_auth') then
    create policy read_tasks_files_auth on public.tasks_files
      for select
      to authenticated
      using (true);
  end if;
end$$;

-- Policy insertion: l'utilisateur authentifié peut insérer ses fichiers
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks_files' and policyname='insert_tasks_files_auth') then
    create policy insert_tasks_files_auth on public.tasks_files
      for insert
      to authenticated
      with check (true);
  end if;
end$$;

-- Policy mise à jour: l'utilisateur peut modifier ses fichiers
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks_files' and policyname='update_tasks_files_auth') then
    create policy update_tasks_files_auth on public.tasks_files
      for update
      to authenticated
      using (true);
  end if;
end$$;

-- Policy suppression: l'utilisateur peut supprimer ses fichiers
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks_files' and policyname='delete_tasks_files_auth') then
    create policy delete_tasks_files_auth on public.tasks_files
      for delete
      to authenticated
      using (true);
  end if;
end$$;

-- Vérification de la création
select 
  'Table tasks_files créée avec succès' as status,
  count(*) as policies_count
from pg_policies 
where schemaname = 'public' 
  and tablename = 'tasks_files';

-- Remarque: La colonne 'attachments' dans la table 'tasks' est conservée
-- pour assurer la rétrocompatibilité avec le code existant.