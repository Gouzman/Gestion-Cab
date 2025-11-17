# 🚀 Guide de Déploiement - Création Automatique du Bucket via RPC

## 📋 Vue d'ensemble

Ce guide explique comment déployer la solution de création automatique du bucket `attachments` en utilisant une fonction RPC (Remote Procedure Call) sécurisée avec `SECURITY DEFINER`.

### 🎯 Problème résolu

```
❌ AVANT : "new row violates row-level security policy"
✅ APRÈS : Création automatique du bucket sans erreur RLS
```

La clé publique (`anon key`) ne peut pas créer de buckets directement à cause des restrictions RLS. La solution utilise une fonction SQL avec privilèges admin.

---

## 🔧 Étape 1 : Exécuter le script SQL dans Supabase

### 1.1 Accéder au SQL Editor

1. Ouvrez votre projet Supabase Dashboard
2. Allez dans **SQL Editor** (icône `</>` dans le menu latéral)
3. Cliquez sur **New Query**

### 1.2 Copier et exécuter le script

```sql
-- Copiez TOUT le contenu du fichier sql/setup_storage.sql
-- Puis cliquez sur "Run" ou appuyez sur Ctrl+Enter
```

📄 **Fichier à exécuter :** `sql/setup_storage.sql`

### 1.3 Vérifier l'exécution

Vous devriez voir ces messages dans la console :

```
✅ Script setup_storage.sql exécuté avec succès !
🚀 Fonction public.create_attachments_bucket() prête à être appelée
🔒 Permissions RLS configurées automatiquement
```

### 1.4 Tests de validation SQL

Exécutez ces requêtes pour valider l'installation :

```sql
-- Test 1 : Vérifier que la fonction existe
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'create_attachments_bucket';

-- Test 2 : Tester la fonction manuellement
SELECT * FROM public.create_attachments_bucket();

-- Test 3 : Vérifier les permissions RLS
SELECT * FROM public.check_storage_permissions();
```

**Résultats attendus :**

```json
// Test 1
proname                    | prosecdef
--------------------------+----------
create_attachments_bucket  | t        ← SECURITY DEFINER activé

// Test 2
{
  "success": true,
  "message": "🚀 Bucket 'attachments' créé avec succès",
  "created": true
}

// Test 3
policy_name                                    | status
----------------------------------------------+----------
Public Access to attachments                   | ✅ Active
Authenticated users can upload to attachments  | ✅ Active
Users can update their own files in attachments| ✅ Active
Users can delete their own files in attachments| ✅ Active
```

---

## 🎮 Étape 2 : Tester depuis l'application

### 2.1 Supprimer le bucket (test de création)

Pour tester la création automatique :

```sql
-- Dans Supabase SQL Editor
DELETE FROM storage.buckets WHERE id = 'attachments';
```

### 2.2 Relancer l'application

```bash
npm run dev
```

### 2.3 Tester l'upload d'un fichier

1. Ouvrez une tâche dans l'application
2. Cliquez sur "Ajouter un document"
3. Sélectionnez un fichier
4. Observez les logs dans la console navigateur

**Logs attendus :**

```
🔧 Bucket 'attachments' non trouvé. Création via fonction SQL sécurisée...
✅ 🚀 Bucket 'attachments' créé automatiquement (via fonction SQL sécurisée)
🔒 Permissions RLS configurées automatiquement
✅ Upload OK: mon-fichier.pdf
```

### 2.4 Vérifier le fichier

1. Le fichier apparaît dans la section "Documents" de la tâche
2. L'URL publique est cliquable et fonctionne
3. Le fichier est visible dans Supabase Dashboard > Storage > attachments

---

## 🔍 Étape 3 : Tests de validation complets

### Test 1 : Upload avec bucket existant

```bash
# Le bucket existe déjà
# Upload un fichier → doit fonctionner sans recréer le bucket
```

**Logs attendus :**
```
✅ Bucket 'attachments' prêt à l'emploi
✅ Upload OK: document.pdf
```

### Test 2 : Upload avec bucket absent

```bash
# Supprimer le bucket dans Supabase
# Relancer l'app et uploader → le bucket doit être créé automatiquement
```

**Logs attendus :**
```
🔧 Bucket 'attachments' non trouvé. Création via fonction SQL sécurisée...
✅ 🚀 Bucket 'attachments' créé automatiquement
✅ Upload OK: image.png
```

### Test 3 : Upload fichier ≤ 50 Mo

```bash
# Uploader un fichier de 30 Mo
# Doit créer une copie cloud + backup base64 local
```

**Logs attendus :**
```
✅ Backup local créé (40.50 Mo en base64)
✅ Upload OK: video.mp4
```

### Test 4 : Upload fichier > 50 Mo

```bash
# Uploader un fichier de 60 Mo
# Doit créer uniquement la copie cloud (pas de backup base64)
```

**Logs attendus :**
```
⚠️ Fichier trop volumineux pour le backup local (60.00 Mo). Limite : 50 Mo.
✅ Upload OK: archive.zip
```

### Test 5 : Accès URL publique

```bash
# Copier l'URL d'un fichier uploadé
# Ouvrir dans un nouvel onglet → doit afficher/télécharger le fichier
```

---

## 🛡️ Sécurité et Permissions

### Règles RLS configurées automatiquement

| Opération | Qui peut ? | Restriction |
|-----------|------------|-------------|
| **SELECT** (lecture) | Tout le monde | Aucune (URLs publiques) |
| **INSERT** (upload) | Utilisateurs authentifiés | Connexion requise |
| **UPDATE** (modification) | Propriétaire du fichier | `auth.uid() = owner` |
| **DELETE** (suppression) | Propriétaire du fichier | `auth.uid() = owner` |

### Avantages de SECURITY DEFINER

```sql
CREATE FUNCTION public.create_attachments_bucket()
SECURITY DEFINER -- ← Exécution avec privilèges admin
```

- ✅ Contourne les restrictions RLS de la clé `anon`
- ✅ Permet la création automatique du bucket
- ✅ Aucune intervention manuelle requise
- ✅ Sécurisé : seule la création du bucket est autorisée

---

## 🚨 Dépannage

### Erreur : "function create_attachments_bucket does not exist"

**Cause :** Le script SQL n'a pas été exécuté dans Supabase.

**Solution :**
1. Ouvrez Supabase Dashboard > SQL Editor
2. Exécutez le fichier `sql/setup_storage.sql`
3. Relancez l'application

### Erreur : "permission denied for table buckets"

**Cause :** L'utilisateur Supabase n'a pas les droits sur `storage.buckets`.

**Solution :**
```sql
-- Dans Supabase SQL Editor
GRANT ALL ON storage.buckets TO postgres, authenticated, service_role;
```

### Le bucket est créé mais l'upload échoue

**Cause :** Les permissions RLS ne sont pas configurées.

**Solution :**
```sql
-- Vérifier les permissions
SELECT * FROM public.check_storage_permissions();

-- Si aucune policy n'est listée, réexécutez le script
-- sql/setup_storage.sql
```

### Cache du bucket bloqué

**Cause :** Le cache JavaScript retient une ancienne valeur.

**Solution :**
```javascript
// Dans la console navigateur
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📊 Architecture de la solution

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  uploadManager.js : ensureAttachmentsBucket()            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 1. supabase.storage.listBuckets()
                     │    → Bucket existe ?
                     │
                     ▼ Non
                     │
                     │ 2. supabase.rpc('create_attachments_bucket')
                     │    → Appel RPC sécurisé
                     │
┌────────────────────▼────────────────────────────────────┐
│              SUPABASE (Backend SQL)                      │
│  Fonction: public.create_attachments_bucket()            │
│  SECURITY DEFINER → Privilèges admin                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 3. INSERT INTO storage.buckets
                     │    → Création avec config optimale
                     │
                     │ 4. CREATE POLICY (x4)
                     │    → Permissions RLS automatiques
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              STORAGE BUCKET : attachments                │
│  - Public: true                                          │
│  - Limite: 50 Mo par fichier                             │
│  - Types: images, PDF, docs, archives                    │
│  - RLS: Lecture publique, upload authentifié             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist de déploiement

- [ ] ✅ Script `sql/setup_storage.sql` exécuté dans Supabase
- [ ] ✅ Fonction RPC `create_attachments_bucket()` créée
- [ ] ✅ Permissions RLS configurées (4 policies)
- [ ] ✅ Test manuel SQL : `SELECT * FROM public.create_attachments_bucket();`
- [ ] ✅ Test frontend : suppression du bucket + upload → recréation auto
- [ ] ✅ Test fichier ≤ 50 Mo : backup base64 créé
- [ ] ✅ Test fichier > 50 Mo : seule copie cloud
- [ ] ✅ Test URL publique : fichier accessible
- [ ] ✅ Logs propres et informatifs dans la console

---

## 📚 Fichiers modifiés

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `sql/setup_storage.sql` | ✅ Créé | Fonction RPC + Permissions |
| `src/lib/uploadManager.js` | ✅ Modifié | Appel RPC au lieu de createBucket() |
| `STORAGE_RPC_DEPLOYMENT_GUIDE.md` | ✅ Créé | Ce guide |

---

## 🚀 Prochaines étapes

Une fois le déploiement validé :

1. **Monitoring** : Surveillez les logs Supabase pour détecter les erreurs
2. **Backup** : Configurez les sauvegardes automatiques du bucket
3. **Optimisation** : Ajoutez un CDN pour améliorer les performances
4. **Nettoyage** : Planifiez la suppression des fichiers orphelins

---

## 💡 Bonnes pratiques

### ✅ À FAIRE

- Exécuter le script SQL en environnement de développement d'abord
- Tester la création automatique avant de déployer en production
- Surveiller les logs Supabase régulièrement
- Documenter les changements de configuration

### ❌ À ÉVITER

- Ne jamais désactiver RLS en production
- Ne pas modifier manuellement les permissions après déploiement
- Ne pas créer le bucket manuellement (utiliser la fonction RPC)
- Ne pas stocker de données sensibles sans chiffrement

---

## 🎓 Ressources complémentaires

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Code source uploadManager.js](./src/lib/uploadManager.js)

---

**✅ Déploiement terminé !** Le système est maintenant autonome et sécurisé.
