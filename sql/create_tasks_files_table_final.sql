-- ============================================================
-- Script de création de la table tasks_files
-- ============================================================
-- Ce script crée la table tasks_files avec toutes les colonnes
-- nécessaires, les contraintes, et les politiques RLS.
-- 
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ✅ Étape 1 : Supprimer la table si elle existe (pour repartir à zéro)
drop table if exists public.tasks_files cascade;

-- ✅ Étape 2 : Créer la table tasks_files
create table public.tasks_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz default now(),
  created_by uuid,
  
  -- Contrainte de clé étrangère vers tasks
  constraint fk_tasks_files_task_id
    foreign key (task_id) 
    references public.tasks(id) 
    on delete cascade,
    
  -- Contrainte de clé étrangère vers profiles (optionnelle)
  constraint fk_tasks_files_created_by
    foreign key (created_by) 
    references public.profiles(id) 
    on delete set null
);

-- ✅ Étape 3 : Créer les index pour améliorer les performances
create index idx_tasks_files_task_id on public.tasks_files(task_id);
create index idx_tasks_files_created_at on public.tasks_files(created_at desc);
create index idx_tasks_files_created_by on public.tasks_files(created_by);

-- ✅ Étape 4 : Activer Row Level Security (RLS)
alter table public.tasks_files enable row level security;

-- ✅ Étape 5 : Créer les politiques d'accès (policies)

-- Policy 1 : Tout le monde peut lire tous les fichiers
create policy "tasks_files_select_policy"
  on public.tasks_files
  for select
  using (true);

-- Policy 2 : Tout le monde peut insérer des fichiers
create policy "tasks_files_insert_policy"
  on public.tasks_files
  for insert
  with check (true);

-- Policy 3 : Tout le monde peut mettre à jour les fichiers
create policy "tasks_files_update_policy"
  on public.tasks_files
  for update
  using (true)
  with check (true);

-- Policy 4 : Tout le monde peut supprimer les fichiers
create policy "tasks_files_delete_policy"
  on public.tasks_files
  for delete
  using (true);

-- ✅ Étape 6 : Rafraîchir le cache du schéma PostgREST
-- Cela force Supabase à recharger la liste des tables disponibles
notify pgrst, 'reload schema';

-- ✅ Étape 7 : Vérification
-- Vérifier que la table existe et est accessible
select 
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'tasks_files'
order by ordinal_position;

-- Afficher un message de succès
do $$
begin
  raise notice '✅ Table tasks_files créée avec succès !';
  raise notice '✅ RLS activé';
  raise notice '✅ Policies configurées';
  raise notice '✅ Index créés';
  raise notice '✅ Cache PostgREST rechargé';
  raise notice '';
  raise notice '🎯 Vous pouvez maintenant utiliser la table tasks_files depuis votre application.';
end $$;