# ✅ GUIDE DE RÉACTIVATION COMPLÈTE - Gestion des Fichiers

## 📊 État Actuel

### ✅ Code Réactivé
- ✅ `uploadManager.js` - Upload avec vérification automatique du bucket
- ✅ `taskFiles.js` - API complète (getTaskFiles, addTaskFile, deleteTaskFile)
- ✅ `DocumentManager.jsx` - Affichage des documents avec jointure
- ✅ `TaskManager.jsx` - Affichage des fichiers dans les tâches
- ✅ Build réussi : **1,583.02 KB** (gzip: 404.50 KB)

### ⏳ Infrastructure Supabase à Créer
1. Bucket Storage `attachments`
2. Table `tasks_files`
3. Politiques RLS

---

## 🚀 ÉTAPE 1 : Créer le Bucket Storage

### Option A : Via Supabase Dashboard (Recommandé)

1. **Accéder à Supabase Dashboard**
   - Ouvrir https://app.supabase.com
   - Sélectionner votre projet
   - Aller dans **Storage** (menu de gauche)

2. **Créer le Bucket**
   - Cliquer sur "New bucket"
   - Nom : `attachments`
   - Configuration :
     - ✅ Public bucket
     - File size limit : 50 MB
     - Allowed MIME types : (laisser vide ou spécifier : `image/*,application/pdf,application/msword,application/vnd.ms-excel`)

3. **Configurer les Politiques**
   - Cliquer sur le bucket `attachments`
   - Onglet "Policies"
   - Cliquer sur "New Policy"

   **Politique 1 - Lecture Publique** :
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'attachments');
   ```

   **Politique 2 - Upload Authentifié** :
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'attachments');
   ```

   **Politique 3 - Suppression par Propriétaire** :
   ```sql
   CREATE POLICY "Users can delete their own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'attachments' AND auth.uid() = owner);
   ```

### Option B : Via Code (Automatique au premier upload)

Le code tentera de créer automatiquement le bucket au premier upload.
Si cela échoue, utilisez l'Option A.

---

## 🗄️ ÉTAPE 2 : Créer la Table tasks_files

### Via SQL Editor

1. **Accéder au SQL Editor**
   - Dans Supabase Dashboard
   - Menu **SQL Editor** (gauche)

2. **Exécuter le Script**
   ```sql
   -- Copier tout le contenu de /sql/setup_tasks_files_complete.sql
   ```

   Ou exécuter ce script complet :

```sql
-- Créer la table tasks_files
CREATE TABLE IF NOT EXISTS public.tasks_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tasks_files_task_id ON public.tasks_files(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_files_created_by ON public.tasks_files(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_files_created_at ON public.tasks_files(created_at DESC);

-- Activer RLS
ALTER TABLE public.tasks_files ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "tasks_files_select" ON public.tasks_files
FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_files_insert" ON public.tasks_files
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_files_update" ON public.tasks_files
FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "tasks_files_delete" ON public.tasks_files
FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks_files TO authenticated;
```

3. **Cliquer sur "Run"**

4. **Vérifier**
   ```sql
   SELECT * FROM public.tasks_files LIMIT 5;
   ```

---

## 🔄 ÉTAPE 3 : Vérification et Test

### Test 1 : Vérifier le Bucket

```javascript
// Dans la console du navigateur (F12)
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
// Devrait afficher un bucket nommé 'attachments'
```

### Test 2 : Tester l'Upload

1. Aller dans l'application
2. Créer une nouvelle tâche
3. Ajouter un fichier (PDF, image, etc.)
4. Vérifier dans la console :
   ```
   ✅ Bucket 'attachments' existe déjà
   ✅ Fichier enregistré dans tasks_files: [nom du fichier]
   ```

### Test 3 : Vérifier l'Affichage

**Section Tâches** :
- Cliquer sur une tâche avec des fichiers
- Les fichiers doivent apparaître avec :
  - Nom du fichier
  - Bouton "Ouvrir" (nouvel onglet)
  - Bouton "Aperçu" (modal)

**Section Documents** :
- Naviguer vers "Documents"
- Devrait afficher :
  - Nom du fichier
  - Titre de la tâche associée
  - Type de fichier
  - Bouton "Ouvrir"

---

## 📋 CHECKLIST COMPLÈTE

### Avant de Commencer
- [ ] Accès au Supabase Dashboard
- [ ] Accès au SQL Editor
- [ ] Application build réussie (`npm run build`)

### Création Infrastructure
- [ ] Bucket `attachments` créé
- [ ] Politiques Storage configurées
- [ ] Table `tasks_files` créée
- [ ] Index créés
- [ ] Politiques RLS activées
- [ ] Permissions accordées

### Tests Fonctionnels
- [ ] Upload d'un fichier réussi
- [ ] Fichier visible dans Storage
- [ ] Enregistrement dans `tasks_files`
- [ ] Affichage dans section Tâches
- [ ] Affichage dans section Documents
- [ ] Preview modal fonctionne
- [ ] Bouton "Ouvrir" fonctionne
- [ ] Pas d'erreurs 404 dans la console

---

## 🐛 Dépannage

### "Upload désactivé : bucket attachments non créé"
➡️ **Solution** : Créer le bucket manuellement (ÉTAPE 1)

### "Could not find the table 'public.tasks_files'"
➡️ **Solution** : Exécuter le script SQL (ÉTAPE 2)

### "Row Level Security policy violation"
➡️ **Solution** : Vérifier les politiques RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'tasks_files';
```

### Fichiers ne s'affichent pas
➡️ **Vérifier** :
1. Console navigateur (F12) pour erreurs
2. Table tasks_files contient des données :
   ```sql
   SELECT * FROM public.tasks_files;
   ```
3. URLs des fichiers sont accessibles

---

## 🎯 RÉSULTAT ATTENDU

Après avoir suivi ces étapes :

✅ **Upload** :
- Fichiers uploadés vers Supabase Storage
- Métadonnées enregistrées dans `tasks_files`
- Aucune erreur console

✅ **Affichage Tâches** :
- Liste des fichiers pour chaque tâche
- Boutons "Ouvrir" et "Aperçu" fonctionnels
- Modal de prévisualisation (PDF, images)

✅ **Affichage Documents** :
- Table complète de tous les documents
- Titre de la tâche associée
- Actions d'ouverture
- Filtrage et recherche

✅ **Performance** :
- Chargement rapide grâce aux index
- Sécurité via RLS
- URLs publiques pour partage

---

## 📞 Support

Si des problèmes persistent :

1. **Vérifier les logs Supabase** :
   - Dashboard → Settings → API → Logs

2. **Console navigateur** :
   - Ouvrir DevTools (F12)
   - Onglet Console
   - Chercher erreurs en rouge

3. **Tester manuellement** :
   ```javascript
   // Test upload
   const file = document.querySelector('input[type=file]').files[0];
   const { data, error } = await supabase.storage
     .from('attachments')
     .upload(`test/${file.name}`, file);
   console.log({ data, error });
   ```

---

## 🎉 Félicitations !

Une fois toutes les étapes complétées, votre système de gestion de fichiers est 100% fonctionnel !

**Prochaines améliorations possibles** :
- Génération automatique de miniatures
- Catégorisation des documents
- Recherche full-text dans les documents
- Versioning des fichiers
- Signature électronique
