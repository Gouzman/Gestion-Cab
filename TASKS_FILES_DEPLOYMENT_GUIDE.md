# Guide de Déploiement : Correction de la Table tasks_files

## 🎯 Objectif
Corriger l'erreur `PGRST205 "Could not find the table 'public.tasks_files'"` et rétablir les liens cliquables vers les fichiers.

## 📋 Étapes de Déploiement

### Étape 1 : Migration SQL Supabase ⚠️ OBLIGATOIRE

1. **Ouvrir Supabase Dashboard**
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet

2. **Exécuter la migration**
   - Menu : `SQL Editor`
   - Copier-coller le contenu du fichier `sql/create_tasks_files_table_final.sql`
   - Cliquer sur `RUN` pour exécuter

3. **Vérifier la création**
   ```sql
   -- Test rapide dans SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'tasks_files';
   ```
   ✅ Doit retourner une ligne avec `tasks_files`

### Étape 2 : Vérification des Buckets Storage

1. **Vérifier les buckets existants**
   - Menu : `Storage`
   - Vérifier que les buckets `attachments` et `task-scans` existent

2. **Si les buckets n'existent pas :**
   ```sql
   -- Créer les buckets via SQL (alternative)
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('attachments', 'attachments', true),
     ('task-scans', 'task-scans', true)
   ON CONFLICT (id) DO NOTHING;
   ```

3. **Configurer les policies Storage**
   ```sql
   -- Policy pour permettre l'upload aux utilisateurs authentifiés
   CREATE POLICY "Authenticated users can upload files" ON storage.objects
   FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('attachments', 'task-scans'));
   
   -- Policy pour permettre la lecture publique
   CREATE POLICY "Public can view files" ON storage.objects
   FOR SELECT TO public USING (bucket_id IN ('attachments', 'task-scans'));
   ```

### Étape 3 : Test de Fonctionnement

1. **Test API tasks_files**
   ```javascript
   // Dans la console du navigateur
   const { data, error } = await supabase
     .from('tasks_files')
     .select('*')
     .limit(1);
   
   console.log('Test tasks_files:', { data, error });
   ```

2. **Test upload de fichier**
   - Créer une nouvelle tâche
   - Ajouter un fichier
   - Vérifier que le fichier apparaît et est cliquable

3. **Test des liens existants**
   - Ouvrir une tâche existante avec des fichiers
   - Cliquer sur un fichier
   - Vérifier que le fichier s'ouvre correctement

## 🔄 Résultats Attendus

### ✅ Avant le fix :
- ❌ Erreur `PGRST205` dans la console
- ❌ Fichiers affichés mais non cliquables
- ❌ `file_url` null ou invalide

### ✅ Après le fix :
- ✅ Plus d'erreur `PGRST205`
- ✅ Fichiers cliquables et accessibles
- ✅ URLs Supabase valides générées automatiquement
- ✅ Compatibilité avec les anciens fichiers (attachments)

## 🛠️ Dépannage

### Problème : Table créée mais toujours erreur PGRST205
**Solution :** Redémarrer l'application React
```bash
npm run dev
# ou
yarn dev
```

### Problème : Policies RLS bloquent l'accès
**Solution :** Vérifier les policies
```sql
-- Voir les policies actuelles
SELECT * FROM pg_policies WHERE tablename = 'tasks_files';

-- Supprimer et recréer si nécessaire
DROP POLICY IF EXISTS tasks_files_select ON public.tasks_files;
CREATE POLICY tasks_files_select ON public.tasks_files FOR SELECT TO authenticated USING (true);
```

### Problème : Fichiers non accessibles après migration
**Solution :** Régénérer les URLs
```javascript
// Script de migration des URLs (optionnel)
const { data: files } = await supabase.from('tasks_files').select('*');
for (const file of files) {
  if (!file.file_url.startsWith('http')) {
    const { data } = supabase.storage.from('attachments').getPublicUrl(file.file_url);
    await supabase.from('tasks_files')
      .update({ file_url: data.publicUrl })
      .eq('id', file.id);
  }
}
```

## 📊 Monitoring Post-Migration

### Métriques à surveiller :
1. **Erreurs 404/PGRST205 :** Doivent disparaître
2. **Taux d'ouverture des fichiers :** Doit augmenter
3. **Logs d'erreur :** Moins d'erreurs liées aux URLs invalides

### Logs à vérifier :
```javascript
// Dans la console navigateur
console.log('Tasks files loaded:', taskFiles);
console.log('File validation:', file.is_accessible, file.valid_url);
```

## 🎉 Validation Finale

- [ ] Migration SQL exécutée avec succès
- [ ] Table `tasks_files` visible dans Supabase
- [ ] Buckets Storage configurés
- [ ] Application redémarrée
- [ ] Test d'upload réussi
- [ ] Test d'ouverture de fichier réussi
- [ ] Plus d'erreurs PGRST205 dans les logs

Une fois tous ces points validés, le système de fichiers liés aux tâches sera complètement fonctionnel ! 🚀