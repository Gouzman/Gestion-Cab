# 🎯 Guide de Correction RLS pour tasks_files

## 📋 Contexte

**Problème actuel :**
```
new row violates row-level security policy for table "tasks_files"
```

**Ce qui fonctionne déjà :**
- ✅ Upload dans Supabase Storage → OK
- ✅ URL publique générée → OK  
- ✅ Fichier visible dans la tâche (icône document) → OK
- ✅ Fichier visible dans la section Documents → OK
- ✅ Logique d'affichage et preview → OK

**Ce qui ne fonctionne PAS :**
- ❌ Insertion dans la table `tasks_files` → BLOQUÉE par RLS

---

## 🔧 Solution : Corriger les Policies RLS

### ✅ ÉTAPE 1 : Exécuter le script SQL

1. Ouvrir **Supabase Dashboard**
2. Aller dans **SQL Editor**
3. Copier le contenu du fichier : `sql/fix_tasks_files_rls_final.sql`
4. Cliquer sur **Run**

Le script va :
- ✅ Activer RLS sur `tasks_files`
- ✅ Supprimer toutes les anciennes policies conflictuelles
- ✅ Créer 3 nouvelles policies minimales :
  - **SELECT** : Tous les utilisateurs authentifiés peuvent lire
  - **INSERT** : Les créateurs peuvent insérer (avec `created_by = auth.uid()`)
  - **DELETE** : Seul le créateur peut supprimer

### ✅ ÉTAPE 2 : Vérifier que `created_by` existe

Le script affichera les colonnes de la table. Vérifiez que `created_by` existe :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks_files'
  AND column_name = 'created_by';
```

**Si la colonne n'existe PAS**, ajoutez-la :

```sql
ALTER TABLE public.tasks_files 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### ✅ ÉTAPE 3 : Tester l'application

1. Créer une nouvelle tâche avec un fichier
2. Vérifier que :
   - ✅ Le fichier est uploadé dans Storage
   - ✅ L'insertion dans `tasks_files` réussit
   - ✅ Le fichier apparaît dans la tâche
   - ✅ Le fichier apparaît dans Documents
   - ✅ Le preview fonctionne

---

## 🚨 Important : CE QUI NE DOIT PAS ÊTRE MODIFIÉ

### ❌ NE TOUCHEZ PAS au code applicatif

Les fichiers suivants sont **CORRECTS** et ne doivent **JAMAIS** être modifiés :

- `src/lib/uploadManager.js` → Logique d'upload **PARFAITE**
- `src/api/taskFiles.js` → API **PARFAITE**
- `src/components/TaskManager.jsx` → Affichage **PARFAIT**
- `src/components/TaskForm.jsx` → Formulaire **PARFAIT**

### ❌ NE TOUCHEZ PAS aux Policies Storage

Les policies du bucket `attachments` sont **CORRECTES** et ne doivent pas être modifiées.

### ❌ NE TOUCHEZ PAS aux fonctions RPC

Les fonctions RPC existantes sont **CORRECTES** et ne doivent pas être modifiées.

---

## 📊 Résultat Attendu

Après avoir exécuté le script SQL, l'application devrait fonctionner **EXACTEMENT comme avant**, mais sans l'erreur RLS :

```
✅ Upload Storage → OK
✅ Génération URL → OK
✅ Insertion tasks_files → OK (CORRIGÉ !)
✅ Affichage tâche → OK
✅ Affichage Documents → OK
✅ Preview → OK
```

---

## 🔍 Debug : Si l'erreur persiste

### Vérifier les policies actives

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'tasks_files';
```

Vous devriez voir :
- `Allow select for authenticated users` (SELECT)
- `Allow insert for creators` (INSERT)
- `Allow delete for creators` (DELETE)

### Vérifier que l'utilisateur est authentifié

Dans la console du navigateur, vérifiez que l'utilisateur a un JWT valide :

```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
```

### Vérifier que `created_by` est bien passé

Dans `src/api/taskFiles.js`, la fonction `addTaskFile` devrait inclure :

```javascript
created_by: userId || currentUserId
```

---

## 📝 Notes Techniques

### Pourquoi cette erreur ?

L'erreur RLS se produit parce que :
1. La table `tasks_files` a RLS activé
2. Les anciennes policies étaient trop restrictives
3. La policy INSERT n'autorisait pas l'insertion avec `auth.uid()`

### Comment fonctionne la correction ?

Les nouvelles policies sont **minimales et permissives** :
- **SELECT** : `USING (true)` → Tous les authentifiés peuvent lire
- **INSERT** : `WITH CHECK (created_by = auth.uid())` → L'utilisateur peut insérer si `created_by` correspond à son UUID
- **DELETE** : `USING (created_by = auth.uid())` → L'utilisateur peut supprimer uniquement ses fichiers

### Sécurité

Ces policies sont **sécurisées** car :
- ✅ Seuls les utilisateurs **authentifiés** peuvent interagir avec la table
- ✅ Chaque utilisateur peut uniquement insérer des fichiers avec **son propre UUID**
- ✅ Chaque utilisateur peut uniquement supprimer **ses propres fichiers**
- ✅ Tous les utilisateurs authentifiés peuvent **lire** tous les fichiers (nécessaire pour l'affichage des documents)

---

## ✅ Checklist Finale

Avant de considérer le problème résolu, vérifiez :

- [ ] Le script SQL a été exécuté sans erreur
- [ ] Les 3 policies sont visibles dans `pg_policies`
- [ ] La colonne `created_by` existe dans `tasks_files`
- [ ] L'upload d'un fichier réussit sans erreur
- [ ] Le fichier apparaît dans la tâche
- [ ] Le fichier apparaît dans Documents
- [ ] Le preview fonctionne
- [ ] Aucune régression n'a été introduite

---

## 🎯 Objectif Final

**L'application doit fonctionner EXACTEMENT comme avant, mais sans l'erreur RLS.**

Aucun changement de comportement ne doit être visible pour l'utilisateur final.

---

**Créé le : 13 novembre 2025**  
**Fichier SQL : `sql/fix_tasks_files_rls_final.sql`**
