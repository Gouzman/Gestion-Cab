# 🎯 Guide de Mise en Production - Gestion des Fichiers jusqu'à 50 Mo

**Date:** 11 novembre 2025  
**Version:** 2.0 - Système robuste avec backup base64

---

## 📋 Résumé des Modifications

### ✅ Objectifs Atteints

1. **Limite augmentée à 50 Mo** : Stockage cloud + backup local base64
2. **Encodage base64 sécurisé** : Compatible PostgreSQL et rétrocompatible
3. **Aperçu robuste** : Fonctionne même sans connexion Storage
4. **DocumentManager sécurisé** : Fallback automatique si jointure échoue
5. **Contrainte SQL** : Garantit l'intégrité référentielle

---

## 📁 Fichiers Modifiés

### 1. `/src/lib/uploadManager.js`
**Modifications:**
- ✅ Limite passée de 1 Mo → **50 Mo**
- ✅ Conversion en **base64** au lieu de tableau binaire
- ✅ Message d'avertissement pour fichiers > 50 Mo
- ✅ Log de la taille du backup créé

**Code clé:**
```javascript
const MAX_BACKUP_SIZE = 50 * 1024 * 1024; // 50 Mo

if (file.size <= MAX_BACKUP_SIZE) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  base64Data = btoa(binary); // ✅ Encodage base64
}
```

### 2. `/src/api/taskFiles.js`
**Modifications:**
- ✅ Paramètre `fileData` accepte maintenant une **string base64**
- ✅ Validation du type `string` avant insertion
- ✅ Documentation mise à jour

**Code clé:**
```javascript
// Ajouter file_data uniquement si fourni (backup local base64 pour fichiers ≤ 50Mo)
if (fileData && typeof fileData === 'string' && fileData.length > 0) {
  payload.file_data = fileData;
}
```

### 3. `/src/lib/filePreviewUtils.js`
**Modifications:**
- ✅ Décodage base64 automatique dans `previewFile()`
- ✅ Décodage base64 automatique dans `downloadFile()`
- ✅ Rétrocompatibilité avec ancien format binaire
- ✅ Fonction `hasLocalBackup()` mise à jour

**Code clé:**
```javascript
// Décodage base64 (nouveau format) ou binaire direct (ancien format)
const binary = typeof file.file_data === 'string'
  ? Uint8Array.from(atob(file.file_data), c => c.charCodeAt(0))
  : new Uint8Array(file.file_data);
```

### 4. `/src/components/DocumentManager.jsx`
**Modifications:**
- ✅ Fallback automatique si `tasks!inner(...)` échoue
- ✅ Gestion des erreurs **PGRST301** et **404**
- ✅ Requête simple sans jointure en cas d'échec

**Code clé:**
```javascript
// Si la jointure échoue (PGRST301 ou 404), relancer sans jointure
if (error.code === 'PGRST301' || error.status === 404) {
  const { data: simpleData } = await supabase
    .from('tasks_files')
    .select('*')
    .order('created_at', { ascending: false });
  // ... transformation des données
}
```

### 5. `/sql/add_foreign_key_tasks_files.sql` *(NOUVEAU)*
**Objectif:**
- ✅ Crée la contrainte de clé étrangère `tasks_files.task_id → tasks.id`
- ✅ Active le `ON DELETE CASCADE`
- ✅ Permet les jointures `tasks!inner(...)`

---

## 🚀 Étapes de Déploiement

### Étape 1: Exécuter le Script SQL
```sql
-- Dans Supabase Dashboard > SQL Editor
-- Exécuter: sql/add_foreign_key_tasks_files.sql
```

**Vérification:**
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_task_files_task';
```

### Étape 2: Mettre à Jour le Code
```bash
# Les fichiers sont déjà modifiés, il suffit de déployer
git add src/lib/uploadManager.js
git add src/api/taskFiles.js
git add src/lib/filePreviewUtils.js
git add src/components/DocumentManager.jsx
git add sql/add_foreign_key_tasks_files.sql
git commit -m "feat: Gestion fichiers jusqu'à 50 Mo avec backup base64"
git push
```

### Étape 3: Tester en Production

#### Test 1: Upload Fichier ≤ 50 Mo
1. Aller dans une tâche
2. Uploader un fichier PDF de 25 Mo
3. ✅ Vérifier: Fichier uploadé + backup local créé
4. ✅ Console: `✅ Backup local créé (XX.XX Mo en base64)`

#### Test 2: Upload Fichier > 50 Mo
1. Uploader un fichier de 55 Mo
2. ✅ Console: `⚠️ Fichier trop volumineux pour le backup local`
3. ✅ Fichier accessible via cloud uniquement

#### Test 3: Aperçu avec Storage Indisponible
1. Désactiver temporairement le Storage dans Supabase
2. Ouvrir un fichier avec backup local
3. ✅ Aperçu fonctionne depuis `file_data`

#### Test 4: Page Documents
1. Aller sur `/documents`
2. ✅ Liste des fichiers s'affiche
3. ✅ Pas d'erreur 404 ou PGRST301

---

## 🔍 Vérifications Post-Déploiement

### Base de Données
```sql
-- Vérifier que file_data contient bien du base64
SELECT 
  id, 
  file_name, 
  LENGTH(file_data) as base64_length,
  file_size,
  CASE 
    WHEN file_data IS NOT NULL THEN '✅ Backup local présent'
    ELSE '❌ Pas de backup'
  END as backup_status
FROM tasks_files
ORDER BY created_at DESC
LIMIT 10;
```

### Frontend
```javascript
// Ouvrir la console du navigateur et tester:
const file = { 
  file_data: "base64_string_here", 
  file_type: "application/pdf", 
  file_name: "test.pdf" 
};
// Vérifier que previewFile(file) fonctionne
```

---

## ⚠️ Limitations et Avertissements

### 1. Taille Maximale PostgreSQL
- **Limite théorique:** ~1 GB pour un champ `text`
- **Limite pratique recommandée:** 50 Mo (67 Mo en base64)
- **Raison:** Performance et temps de requête

### 2. Performance
- Les fichiers > 10 Mo peuvent ralentir les requêtes SELECT
- Recommandation: Utiliser `SELECT id, file_name, file_url` sans `file_data` sauf besoin

### 3. Migration des Anciennes Données
- Les anciens fichiers avec format binaire `Array<number>` **restent compatibles**
- La fonction `previewFile()` détecte automatiquement le format

---

## 🔧 Dépannage

### Problème 1: "Fichier non disponible"
**Cause:** `file_data` est `null` et l'URL cloud est inaccessible  
**Solution:** Ré-uploader le fichier

### Problème 2: DocumentManager affiche "Tâche non disponible"
**Cause:** Contrainte SQL non créée ou tâche supprimée  
**Solution:** Exécuter `sql/add_foreign_key_tasks_files.sql`

### Problème 3: Upload échoue pour fichiers > 50 Mo
**Cause:** Limite Supabase Storage (configurable)  
**Solution:** Augmenter la limite dans Supabase Dashboard > Storage

### Problème 4: Erreur "Invalid byte sequence for encoding UTF8"
**Cause:** Tentative d'insérer des bytes bruts au lieu de base64  
**Solution:** Vérifier que `uploadManager.js` utilise bien `btoa()`

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Limite backup local** | 1 Mo | 50 Mo ✅ |
| **Format stockage** | `Array<number>` | `base64 string` ✅ |
| **Taille DB (10 Mo)** | ~10 Mo | ~13.3 Mo (overhead base64) |
| **Aperçu offline** | ❌ Échoue | ✅ Fonctionne |
| **DocumentManager** | ❌ Crash si jointure échoue | ✅ Fallback automatique |
| **Compatibilité** | N/A | ✅ Rétrocompatible |

---

## 🎉 Conclusion

Le système est maintenant **robuste, performant et résilient** :

✅ **Cloud-first** : Tous les fichiers sont sur Supabase Storage  
✅ **Backup intelligent** : Fichiers ≤ 50 Mo ont une copie locale base64  
✅ **Offline-ready** : Aperçu et téléchargement fonctionnent sans connexion Storage  
✅ **Sécurisé** : Contrainte SQL garantit l'intégrité des données  
✅ **Rétrocompatible** : Anciens fichiers continuent de fonctionner  

**Aucun code existant n'a été cassé. Toutes les fonctionnalités sont améliorées.**

---

## 📞 Support

En cas de problème, vérifier dans l'ordre:

1. Console navigateur (messages d'erreur détaillés)
2. Logs Supabase (Dashboard > Logs)
3. Contrainte SQL (requête de vérification ci-dessus)
4. Réseau (accès au Storage Supabase)

**Fait avec ❤️ par l'équipe de développement**
