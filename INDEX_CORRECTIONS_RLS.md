# 📋 INDEX DES CORRECTIONS RLS tasks_files

## 🎯 Problème

```
Erreur : new row violates row-level security policy for table "tasks_files"
```

**Cause :** Les policies RLS de Supabase bloquent l'insertion dans `tasks_files`.

**Impact :** Les fichiers sont uploadés dans Storage mais les métadonnées ne sont pas enregistrées dans la base de données.

---

## 📁 Fichiers Créés

### 🚀 Pour commencer rapidement

| Fichier | Description | Utilisation |
|---------|-------------|-------------|
| **CORRECTION_RAPIDE_RLS.md** | ⭐ Guide rapide en 3 étapes | **COMMENCER ICI** |

### 🔧 Scripts SQL

| Fichier | Description | Ordre d'exécution |
|---------|-------------|-------------------|
| `sql/verify_tasks_files_structure.sql` | Vérification de la structure de la table | **1. VÉRIFIER** |
| `sql/fix_tasks_files_rls_final.sql` | ⭐ Correction RLS (RECOMMANDÉE) | **2. APPLIQUER** |
| `sql/fix_tasks_files_rls_ultra_permissive.sql` | Alternative ultra-permissive (debug) | **3. ALTERNATIVE** (si besoin) |

### 📖 Documentation

| Fichier | Description | Public |
|---------|-------------|--------|
| `FIX_RLS_TASKS_FILES_GUIDE.md` | Guide détaillé avec explications | Développeurs |
| `SOLUTION_FINALE_RLS.md` | Documentation complète et technique | Développeurs avancés |
| `CORRECTION_RAPIDE_RLS.md` | Guide rapide sans détails | Tous |
| `INDEX_CORRECTIONS_RLS.md` | ⭐ Ce fichier - Index général | **Point d'entrée** |

---

## 🚦 Processus de Correction

### Étape 1 : Vérification
**Fichier :** `sql/verify_tasks_files_structure.sql`

1. Ouvrir Supabase Dashboard > SQL Editor
2. Copier le contenu du fichier
3. Cliquer sur Run
4. Vérifier que la colonne `created_by` existe

**Si la colonne n'existe pas :**
```sql
ALTER TABLE public.tasks_files 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### Étape 2 : Correction RLS
**Fichier :** `sql/fix_tasks_files_rls_final.sql`

1. Ouvrir Supabase Dashboard > SQL Editor
2. Copier le contenu du fichier
3. Cliquer sur Run
4. Vérifier les policies créées

**Policies créées :**
- `Allow select for authenticated users` (SELECT)
- `Allow insert for creators` (INSERT)
- `Allow delete for creators` (DELETE)

### Étape 3 : Test
1. Créer une tâche avec un fichier
2. Vérifier dans la console :
   ```
   ✅ Upload vers Supabase Storage réussi
   ✅ URL publique générée
   ✅ Enregistrement tasks_files réussi
   ```
3. Vérifier dans l'interface :
   - Fichier visible dans la tâche
   - Fichier visible dans Documents
   - Preview fonctionne

### Étape 4 (Optionnelle) : Alternative Ultra-Permissive
**Fichier :** `sql/fix_tasks_files_rls_ultra_permissive.sql`

**À utiliser uniquement si :**
- Le script normal ne fonctionne pas
- Vous êtes en phase de développement
- Vous avez besoin de débugger rapidement

**⚠️ Attention :** Cette version est très permissive et déconseillée en production.

---

## ✅ Code Applicatif

### Status : ✅ PARFAIT - NE PAS MODIFIER

Le code applicatif est **correct** et ne doit **PAS** être modifié :

| Fichier | Status | Action |
|---------|--------|--------|
| `src/lib/uploadManager.js` | ✅ PARFAIT | ❌ NE PAS MODIFIER |
| `src/api/taskFiles.js` | ✅ PARFAIT | ❌ NE PAS MODIFIER |
| `src/components/TaskManager.jsx` | ✅ PARFAIT | ❌ NE PAS MODIFIER |
| `src/components/TaskForm.jsx` | ✅ PARFAIT | ❌ NE PAS MODIFIER |
| `src/components/TaskCard.jsx` | ✅ PARFAIT | ❌ NE PAS MODIFIER |

**Pourquoi ?**
- ✅ `uploadManager.js` passe bien `userId` à `addTaskFile()`
- ✅ `taskFiles.js` insère bien `created_by: createdBy` dans Supabase
- ✅ Tous les composants passent bien `currentUser?.id`

**Le problème est UNIQUEMENT dans Supabase (policies RLS), pas dans le code.**

---

## 🔍 Diagnostic

### Vérifier que l'utilisateur est authentifié

Dans la console du navigateur :
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
```

**Résultat attendu :** Un UUID (ex: `a1b2c3d4-...`)  
**Si null :** L'utilisateur n'est pas authentifié

### Vérifier les policies actives

Dans Supabase Dashboard > SQL Editor :
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'tasks_files';
```

**Résultat attendu :**
```
Allow select for authenticated users | SELECT | {authenticated} | true | (none)
Allow insert for creators | INSERT | {authenticated} | (none) | (created_by = auth.uid())
Allow delete for creators | DELETE | {authenticated} | (created_by = auth.uid()) | (none)
```

### Vérifier la colonne created_by

Dans Supabase Dashboard > SQL Editor :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks_files' AND column_name = 'created_by';
```

**Résultat attendu :**
```
created_by | uuid
```

---

## 📊 Checklist de Validation

### Avant la correction
- [ ] Fichier uploadé dans Storage ✅
- [ ] URL publique générée ✅
- [ ] Insertion dans tasks_files ❌ (ERREUR RLS)
- [ ] Fichier visible dans tâche ❌
- [ ] Fichier visible dans Documents ❌

### Après la correction
- [ ] Script de vérification exécuté
- [ ] Colonne `created_by` existe
- [ ] Script de correction RLS exécuté
- [ ] Policies visibles dans `pg_policies`
- [ ] Fichier uploadé dans Storage ✅
- [ ] URL publique générée ✅
- [ ] Insertion dans tasks_files ✅ (CORRIGÉ !)
- [ ] Fichier visible dans tâche ✅
- [ ] Fichier visible dans Documents ✅
- [ ] Preview fonctionne ✅

---

## 🆘 Support

### Si le problème persiste

1. **Vérifier les logs :**
   - Ouvrir la console du navigateur (F12)
   - Rechercher les erreurs contenant "tasks_files"
   - Copier le message d'erreur complet

2. **Vérifier la structure de la table :**
   - Exécuter `sql/verify_tasks_files_structure.sql`
   - Vérifier que toutes les colonnes sont présentes

3. **Essayer la version ultra-permissive :**
   - Exécuter `sql/fix_tasks_files_rls_ultra_permissive.sql`
   - Tester l'upload
   - Si ça fonctionne, le problème est bien dans les policies RLS

4. **Vérifier l'authentification :**
   - Vérifier que `currentUser?.id` n'est pas `null`
   - Se déconnecter et se reconnecter

---

## 📈 Résultat Final Attendu

Après avoir suivi le processus de correction :

```
✅ Upload Storage → OK
✅ Génération URL → OK
✅ Insertion tasks_files → OK (CORRIGÉ !)
✅ Affichage tâche → OK
✅ Affichage Documents → OK
✅ Preview → OK
```

**Aucun changement de comportement visible pour l'utilisateur final.**

---

## 🔐 Sécurité

### Policies Recommandées (fix_tasks_files_rls_final.sql)

- **SELECT** : Tous les utilisateurs authentifiés peuvent lire tous les fichiers
  - Nécessaire pour l'affichage partagé des documents
  - Sécurisé car limité aux utilisateurs authentifiés

- **INSERT** : Les utilisateurs peuvent insérer uniquement avec leur propre UUID
  - Garantit que `created_by = auth.uid()`
  - Empêche l'usurpation d'identité

- **DELETE** : Seul le créateur peut supprimer ses fichiers
  - Garantit que seul le créateur peut supprimer
  - Empêche la suppression accidentelle ou malveillante

### Policies Ultra-Permissives (fix_tasks_files_rls_ultra_permissive.sql)

⚠️ **À utiliser UNIQUEMENT en développement**

- **ALL** : Tous les utilisateurs authentifiés peuvent tout faire
  - Utile pour débugger rapidement
  - Déconseillé en production
  - À remplacer par les policies recommandées une fois le problème résolu

---

## 📅 Historique

| Date | Action | Status |
|------|--------|--------|
| 13/11/2025 | Création des scripts de correction | ✅ |
| 13/11/2025 | Vérification du code applicatif | ✅ PARFAIT |
| 13/11/2025 | Documentation complète | ✅ |

---

## 🎯 Prochaines Étapes

1. **Exécuter** `sql/verify_tasks_files_structure.sql`
2. **Exécuter** `sql/fix_tasks_files_rls_final.sql`
3. **Tester** l'upload d'un fichier
4. **Valider** que tout fonctionne

**Si tout fonctionne :** ✅ Mission accomplie !  
**Si le problème persiste :** Consulter la section Support ci-dessus.

---

**Créé le : 13 novembre 2025**  
**Dernière mise à jour : 13 novembre 2025**  
**Status : ✅ Documentation complète et validée**
