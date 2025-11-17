# 🚀 Guide Express : Créer la Table tasks_files

## ❌ Problème Actuel
```
❌ Table tasks_files inexistante
❌ Could not find the table 'public.tasks_files' in the schema cache
```

## ✅ Solution en 3 Minutes

### Étape 1 : Ouvrir le SQL Editor
Cliquez sur ce lien direct :
👉 **https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/sql/new**

### Étape 2 : Copier le Script SQL
Ouvrez le fichier : **`sql/create_tasks_files_complete.sql`**

Ou copiez directement ce script :

```sql
-- Migration complète pour tasks_files avec file_data
create table if not exists public.tasks_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  file_type text,
  file_data text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Index
create index if not exists idx_tasks_files_task_id on public.tasks_files(task_id);
create index if not exists idx_tasks_files_created_at on public.tasks_files(created_at desc);

-- RLS
alter table public.tasks_files enable row level security;

-- Policies
create policy if not exists "tasks_files_select_policy" on public.tasks_files for select to authenticated using (true);
create policy if not exists "tasks_files_insert_policy" on public.tasks_files for insert to authenticated with check (true);
create policy if not exists "tasks_files_update_policy" on public.tasks_files for update to authenticated using (true) with check (true);
create policy if not exists "tasks_files_delete_policy" on public.tasks_files for delete to authenticated using (true);

-- Fonction refresh cache
create or replace function public.refresh_schema_cache()
returns void language sql security definer
as $$ select pg_notify('pgrst', 'reload schema'); $$;

grant execute on function public.refresh_schema_cache() to authenticated, anon;

-- Rafraîchir le cache
select public.refresh_schema_cache();
```

### Étape 3 : Exécuter
1. Collez le script dans l'éditeur SQL
2. Cliquez sur **"RUN"** en bas à droite
3. Attendez le message de succès ✅

### Étape 4 : Vérifier
Dans l'éditeur SQL, exécutez :
```sql
SELECT * FROM tasks_files LIMIT 1;
```

Si aucune erreur → **C'est bon !** ✅

### Étape 5 : Recharger Votre Application
1. Retournez dans votre application
2. Appuyez sur **F5** pour recharger la page
3. Créez une nouvelle tâche avec un fichier

## 📊 Résultat Attendu

**Avant** :
```
❌ Could not find the table 'public.tasks_files'
```

**Après** :
```
✅ Upload vers Supabase Storage réussi
✅ URL publique générée: https://...
💾 Enregistrement des métadonnées dans tasks_files...
✅ Enregistrement tasks_files réussi (id: XXX)
✅ Fichier "..." enregistré et lié à la tâche YYY
```

## 🔧 En Cas de Problème

### Erreur "policy already exists"
➜ Normal, le script continue quand même

### Erreur "relation tasks_files already exists"
➜ Parfait ! La table existe déjà
➜ Exécutez juste : `SELECT public.refresh_schema_cache();`

### Toujours des erreurs 404
1. Vérifiez que la table existe : `\dt tasks_files`
2. Rafraîchissez le cache : `SELECT public.refresh_schema_cache();`
3. Attendez 10 secondes
4. Rechargez votre application (F5)

## 🎯 Structure de la Table

| Colonne      | Type        | Description                          |
|--------------|-------------|--------------------------------------|
| id           | UUID        | Identifiant unique                   |
| task_id      | UUID        | Lien vers la tâche                   |
| file_name    | TEXT        | Nom du fichier                       |
| file_url     | TEXT        | URL dans Supabase Storage            |
| file_size    | BIGINT      | Taille en octets                     |
| file_type    | TEXT        | Type MIME (application/pdf, etc.)    |
| file_data    | TEXT        | Backup base64 (≤50Mo)               |
| created_at   | TIMESTAMPTZ | Date d'upload                        |
| created_by   | UUID        | ID de l'utilisateur                  |

## ✅ Prochaine Étape

Une fois le script exécuté :
1. Rechargez votre application (F5)
2. Créez une tâche avec le fichier "BIBLE CHAMPIONS LEAGUE..."
3. Vérifiez dans la console :
   ```
   ✅ Fichier enregistré et lié à la tâche XXX — ID: YYY
   ```

**Temps total : 3 minutes** ⏱️
