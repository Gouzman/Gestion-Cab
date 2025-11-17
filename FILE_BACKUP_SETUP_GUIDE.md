# 🔒 Guide de mise en place du backup local des fichiers

## 🎯 Contexte

L'application gère déjà l'upload de fichiers vers Supabase Storage (`attachments`).  
Cependant, si un fichier est supprimé du Storage ou si le bucket est temporairement inaccessible, les métadonnées existent toujours dans la base mais le fichier n'est plus récupérable.

---

## ✅ Solution : Backup local automatique

Le système a été amélioré pour **sauvegarder automatiquement les fichiers < 1 Mo directement dans la base de données**.

### 🎯 Avantages :

- ✅ **Résilience** : Même si le Storage est down, les petits fichiers restent accessibles
- ✅ **Automatique** : Pas d'action utilisateur requise
- ✅ **Transparent** : Le système choisit automatiquement la meilleure source (URL ou backup)
- ✅ **Non intrusif** : Aucun changement dans l'interface utilisateur

---

## 🔧 Installation (1 seule fois)

### **Étape 1 : Ajouter la colonne `file_data` dans Supabase**

1. Ouvrez [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu gauche)
4. Cliquez sur **"New query"**
5. Copiez **tout le contenu** du fichier suivant :
   ```
   sql/add_file_data_column.sql
   ```
6. Collez-le dans l'éditeur
7. Cliquez sur **"Run"** (ou `Cmd+Enter`)

---

### **Étape 2 : Vérifier que tout fonctionne**

Vous devriez voir dans les résultats :

```
✅ Colonne file_data ajoutée avec succès !
✅ Index créé pour optimiser les requêtes
✅ Cache PostgREST rechargé

🎯 Les fichiers < 1Mo seront désormais sauvegardés avec backup local.
🎯 En cas d'URL invalide, le système utilisera automatiquement le backup.
```

---

## 🚀 Fonctionnement

### **Upload de fichiers**

Quand un utilisateur uploade un fichier :

1. **Le fichier est uploadé vers Supabase Storage** (comportement normal)
2. **Si le fichier < 1 Mo** :
   - Une copie binaire est également sauvegardée dans la colonne `file_data`
   - Conversion automatique en format BYTEA (PostgreSQL)
3. **Si le fichier ≥ 1 Mo** :
   - Seule l'URL Storage est sauvegardée (pas de backup local)
   - Message console : *"⚠️ Fichier trop volumineux pour backup local"*

### **Affichage/Aperçu de fichiers**

Quand un utilisateur clique sur "Prévisualiser" ou "Ouvrir" :

1. **Le système teste l'URL Storage** (requête HEAD)
2. **Si l'URL est valide** → Ouverture directe (comportement normal)
3. **Si l'URL est invalide/inaccessible** :
   - Le système vérifie la présence de `file_data`
   - Si backup disponible → Reconstruction du fichier via Blob + ObjectURL
   - Ouverture dans un nouvel onglet
4. **Si ni URL ni backup** :
   - Message utilisateur : *"⚠️ Le fichier n'est plus disponible"*

---

## 📊 Structure de la table mise à jour

La table `tasks_files` contient maintenant :

| Colonne       | Type          | Description                                      |
|---------------|---------------|--------------------------------------------------|
| `id`          | uuid          | ID unique (auto-généré)                          |
| `task_id`     | uuid          | Référence vers `tasks.id`                        |
| `file_name`   | text          | Nom du fichier                                   |
| `file_url`    | text          | URL Supabase Storage                             |
| `file_type`   | text          | Type MIME (image/png, etc.)                      |
| `file_size`   | bigint        | Taille en octets                                 |
| `created_at`  | timestamptz   | Date de création                                 |
| `created_by`  | uuid          | ID de l'utilisateur                              |
| **`file_data`** | **BYTEA**   | **🆕 Backup local (si < 1Mo)**                   |

---

## 🔍 Indicateurs visuels

Dans l'interface, les fichiers avec backup local affichent :

- **Bouton "💾 Backup"** au lieu de "Prévisualiser" si l'URL est invalide mais backup disponible
- **Texte "❌ Indisponible"** si ni URL ni backup ne sont accessibles

---

## 💾 Optimisations

### **Performance**

- ✅ Index partiel créé sur `(task_id)` uniquement pour les lignes avec `file_data NOT NULL`
- ✅ Pas d'impact sur les fichiers existants (colonne nullable)
- ✅ Le backup n'est créé que pour les fichiers < 1 Mo

### **Stockage**

- Un fichier de **500 Ko** = ~500 Ko en base + ~500 Ko en Storage = **~1 Mo total**
- Les fichiers ≥ 1 Mo ne sont **jamais** dupliqués en base

---

## ❓ FAQ

### **Q : Les fichiers existants auront-ils un backup ?**
**R :** Non. Seuls les **nouveaux fichiers uploadés après cette mise à jour** auront un backup local (si < 1 Mo).

### **Q : Puis-je forcer le backup pour des fichiers > 1 Mo ?**
**R :** Oui, mais déconseillé. Augmentez `MAX_BACKUP_SIZE` dans `src/lib/uploadManager.js` (ligne 53).

### **Q : Comment supprimer les backups pour libérer de l'espace ?**
**R :** 
```sql
UPDATE public.tasks_files 
SET file_data = NULL 
WHERE file_data IS NOT NULL 
  AND file_size > 500000; -- Garder uniquement < 500 Ko
```

### **Q : Le système fonctionne-t-il sans cette mise à jour ?**
**R :** Oui, totalement rétrocompatible. Sans la colonne `file_data`, le comportement reste inchangé (URL uniquement).

---

## 🔒 Sécurité

- ✅ Les données binaires sont stockées en **BYTEA** (format sécurisé PostgreSQL)
- ✅ Les politiques RLS existantes s'appliquent également à `file_data`
- ✅ Aucun fichier sensible n'est exposé (même protection que l'URL Storage)

---

## 📞 Support

En cas de problème :

1. Vérifiez que le script SQL s'est exécuté sans erreur
2. Vérifiez dans **Table Editor > tasks_files** que la colonne `file_data` existe
3. Testez l'upload d'un petit fichier (< 1 Mo) et vérifiez en base que `file_data` contient des données
4. Consultez les logs de la console navigateur (`F12`) pour voir les messages de debug

---

## 🎯 Prochaines étapes

Après avoir exécuté le script SQL :

1. **Rechargez votre application** (`Ctrl+Shift+R` / `Cmd+Shift+R`)
2. **Uploadez un nouveau fichier < 1 Mo** dans une tâche
3. **Vérifiez en base** que `file_data` contient bien les données binaires
4. **(Optionnel)** Supprimez le fichier du Storage et testez l'aperçu → devrait fonctionner via backup

Le système est maintenant **résilient** et **transparent** pour l'utilisateur ! 🎉
