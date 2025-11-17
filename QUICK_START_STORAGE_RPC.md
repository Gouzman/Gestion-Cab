# 🚀 Quick Start - Création Automatique du Bucket

## ⚡ Installation en 3 minutes

### 📋 Prérequis
- Accès à votre projet Supabase Dashboard
- Application en cours de développement

---

## 🎯 Étape 1 : Exécuter le script SQL (2 min)

### 1.1 Accéder au SQL Editor

```
Supabase Dashboard → SQL Editor (icône </>) → New Query
```

### 1.2 Copier-coller le script

1. Ouvrez le fichier `sql/setup_storage.sql`
2. Copiez **TOUT** le contenu (Ctrl+A → Ctrl+C)
3. Collez dans le SQL Editor de Supabase
4. Cliquez sur **Run** (ou Ctrl+Enter)

### 1.3 Vérifier l'exécution

✅ Vous devez voir :
```
✅ Script setup_storage.sql exécuté avec succès !
🚀 Fonction public.create_attachments_bucket() prête à être appelée
🔒 Permissions RLS configurées automatiquement
```

---

## 🧪 Étape 2 : Tester la fonction (30 sec)

Dans le même SQL Editor, exécutez :

```sql
SELECT * FROM public.create_attachments_bucket();
```

✅ Résultat attendu :
```json
{
  "success": true,
  "message": "🚀 Bucket 'attachments' créé avec succès",
  "created": true
}
```

---

## 🎮 Étape 3 : Tester depuis l'application (30 sec)

### Option A : Bucket absent (test de création auto)

```bash
# 1. Supprimer le bucket dans Supabase Dashboard
Storage → attachments → Delete

# 2. Relancer l'application
npm run dev

# 3. Uploader un fichier
# → Le bucket doit être créé automatiquement
```

### Option B : Bucket existant (test normal)

```bash
# 1. Relancer l'application
npm run dev

# 2. Uploader un fichier
# → L'upload doit fonctionner directement
```

---

## ✅ Logs attendus dans la console navigateur

### Cas 1 : Bucket absent (première fois)

```javascript
🔧 Bucket 'attachments' non trouvé. Création via fonction SQL sécurisée...
✅ 🚀 Bucket 'attachments' créé automatiquement (via fonction SQL sécurisée)
🔒 Permissions RLS configurées automatiquement
✅ Upload OK: document.pdf
```

### Cas 2 : Bucket existant

```javascript
✅ Bucket 'attachments' prêt à l'emploi
✅ Upload OK: image.png
```

### Cas 3 : Fichier ≤ 50 Mo

```javascript
✅ Backup local créé (40.50 Mo en base64)
✅ Upload OK: video.mp4
```

### Cas 4 : Fichier > 50 Mo

```javascript
⚠️ Fichier trop volumineux pour le backup local (60.00 Mo). Limite : 50 Mo.
✅ Upload OK: archive.zip
```

---

## 🚨 Problèmes courants

### ❌ "function create_attachments_bucket does not exist"

**Cause** : Script SQL non exécuté

**Solution** :
```
1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez le contenu de sql/setup_storage.sql
3. Cliquez sur Run
4. Relancez l'application
```

### ❌ "permission denied for table buckets"

**Cause** : Droits insuffisants

**Solution** :
```sql
-- Dans Supabase SQL Editor
GRANT ALL ON storage.buckets TO postgres, authenticated, service_role;
```

### ❌ Le bucket est créé mais l'upload échoue

**Cause** : Permissions RLS manquantes

**Solution** :
```sql
-- Vérifier les permissions
SELECT * FROM public.check_storage_permissions();

-- Si vide, réexécuter sql/setup_storage.sql
```

---

## 📊 Vérifications rapides

### ✅ La fonction RPC existe ?

```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'create_attachments_bucket';
```

Résultat attendu :
```
proname                    | prosecdef
--------------------------+----------
create_attachments_bucket  | t
```

### ✅ Les permissions RLS sont actives ?

```sql
SELECT * FROM public.check_storage_permissions();
```

Résultat attendu : **4 policies actives**

### ✅ Le bucket est configuré correctement ?

```sql
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'attachments';
```

Résultat attendu :
```
id          | name        | public | file_size_limit
-----------+-------------+--------+----------------
attachments | attachments | true   | 52428800
```

---

## 🎯 Checklist finale

- [ ] Script `sql/setup_storage.sql` exécuté ✅
- [ ] Fonction RPC testée → succès ✅
- [ ] Application relancée ✅
- [ ] Upload testé → fichier dans Storage ✅
- [ ] URL publique accessible ✅

---

## 📚 Documentation complète

Pour plus de détails :
- [Guide de déploiement complet](./STORAGE_RPC_DEPLOYMENT_GUIDE.md)
- [Résumé de la solution](./STORAGE_RPC_SOLUTION_SUMMARY.md)
- [Script SQL](./sql/setup_storage.sql)

---

## 💡 Ce qui a changé

### Avant (❌)
```javascript
// Création directe avec clé anon → échoue
await supabase.storage.createBucket('attachments');
// ❌ "new row violates row-level security policy"
```

### Après (✅)
```javascript
// Appel RPC à fonction SECURITY DEFINER → réussit
await supabase.rpc('create_attachments_bucket');
// ✅ Bucket créé avec privilèges admin
```

---

**🚀 Vous êtes prêt ! L'application est maintenant autonome.**

Si tout fonctionne, vous ne devriez plus jamais voir l'erreur RLS. Le système crée et configure automatiquement le bucket au premier upload.
