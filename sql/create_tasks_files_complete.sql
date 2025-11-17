-- Migration complète pour tasks_files avec gestion automatique des erreurs
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table tasks_files si elle n'existe pas
create table if not exists public.tasks_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  file_type text,
  file_data text,  -- Backup local en base64 (fichiers ≤ 50Mo)
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 2. Ajouter la colonne file_data si elle n'existe pas (pour tables existantes)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'tasks_files' 
    and column_name = 'file_data'
  ) then
    alter table public.tasks_files add column file_data text;
    raise notice '✅ Colonne file_data ajoutée à tasks_files';
  end if;
end$$;

-- 3. Index pour accélérer les recherches par task_id
create index if not exists idx_tasks_files_task_id on public.tasks_files(task_id);

-- 4. Index sur created_at pour l'ordre d'affichage
create index if not exists idx_tasks_files_created_at on public.tasks_files(created_at desc);

-- 5. Activer la sécurité RLS
alter table public.tasks_files enable row level security;

-- 6. Créer les politiques de sécurité de manière conditionnelle
do $$
begin
  -- Politique pour SELECT
  if not exists (
    select 1 from pg_policies 
    where policyname = 'tasks_files_select_policy' 
    and tablename = 'tasks_files'
  ) then
    create policy tasks_files_select_policy on public.tasks_files
    for select to authenticated 
    using (true);
  end if;

  -- Politique pour INSERT
  if not exists (
    select 1 from pg_policies 
    where policyname = 'tasks_files_insert_policy' 
    and tablename = 'tasks_files'
  ) then
    create policy tasks_files_insert_policy on public.tasks_files
    for insert to authenticated 
    with check (true);
  end if;

  -- Politique pour UPDATE
  if not exists (
    select 1 from pg_policies 
    where policyname = 'tasks_files_update_policy' 
    and tablename = 'tasks_files'
  ) then
    create policy tasks_files_update_policy on public.tasks_files
    for update to authenticated 
    using (true) with check (true);
  end if;

  -- Politique pour DELETE
  if not exists (
    select 1 from pg_policies 
    where policyname = 'tasks_files_delete_policy' 
    and tablename = 'tasks_files'
  ) then
    create policy tasks_files_delete_policy on public.tasks_files
    for delete to authenticated 
    using (true);
  end if;
end$$;

-- 7. Fonction RPC pour rafraîchir le cache PostgREST
create or replace function public.refresh_schema_cache()
returns void
language sql
security definer
as $$
  -- Cette fonction est utilisée pour forcer Supabase à recharger son cache du schéma
  select pg_notify('pgrst', 'reload schema');
$$;

-- Donner accès à cette fonction aux utilisateurs authentifiés
grant execute on function public.refresh_schema_cache() to authenticated;
grant execute on function public.refresh_schema_cache() to anon;

-- 8. Créer une fonction pour migrer les anciens attachments si nécessaire
create or replace function migrate_existing_attachments()
returns void
language plpgsql
security definer
as $$
declare
  task_record record;
  attachment_url text;
begin
  -- Parcourir les tâches qui ont des attachments mais pas d'entrées dans tasks_files
  for task_record in 
    select t.id, t.attachments
    from public.tasks t
    where t.attachments is not null 
    and jsonb_array_length(t.attachments::jsonb) > 0
    and not exists (
      select 1 from public.tasks_files tf where tf.task_id = t.id
    )
  loop
    -- Parcourir chaque attachment dans le tableau JSON
    for attachment_url in 
      select jsonb_array_elements_text(task_record.attachments::jsonb)
    loop
      if attachment_url is not null and attachment_url != '' then
        -- Insérer dans tasks_files
        insert into public.tasks_files (
          task_id,
          file_name,
          file_url,
          created_at
        ) values (
          task_record.id,
          case 
            when attachment_url like '%/%' then split_part(attachment_url, '/', -1)
            else attachment_url
          end,
          attachment_url,
          now()
        );
      end if;
    end loop;
  end loop;
end$$;

-- 9. Exécuter la migration des anciens attachments
select migrate_existing_attachments();

-- 10. Rafraîchir immédiatement le cache PostgREST
select public.refresh_schema_cache();

-- 11. Message de confirmation
do $$
begin
  raise notice '✅ Migration tasks_files terminée avec succès !';
  raise notice '✅ Table tasks_files créée avec index et politiques RLS';
  raise notice '✅ Fonction refresh_schema_cache() disponible';
  raise notice '✅ Cache Supabase rechargé - les erreurs PGRST205 devraient disparaître';
end$$;