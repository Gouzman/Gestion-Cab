# 🔄 Migration tasks_files - Guide d'utilisation

## ✅ **Étapes de migration**

### 1️⃣ **Exécution SQL sur Supabase**
```bash
# Dans Supabase Dashboard > SQL Editor
# Exécuter le contenu de : sql/create_tasks_files_migration.sql
```

### 2️⃣ **Vérification de la migration**
```sql
-- Vérifier que la table existe
SELECT * FROM information_schema.tables WHERE table_name = 'tasks_files';

-- Tester l'API REST
GET /rest/v1/tasks_files?select=*&limit=1
-- Doit retourner 200 avec []
```

### 3️⃣ **Test du fallback**
```sql
-- Si la table n'existe pas encore, l'API utilisera automatiquement
-- les données de task.attachments comme fallback
```

## 🔧 **API Helper utilisé**

### `getTaskFiles(taskId, attachmentsFallback)`
- **Priorité 1** : Lecture depuis `tasks_files`
- **Priorité 2** : Fallback sur `attachments` si table vide/absente
- **Priorité 3** : Retour array vide en cas d'erreur

### `addTaskFile(taskId, fileName, fileUrl, ...)`
- Ajoute un fichier dans `tasks_files` après upload
- Gestion d'erreur silencieuse si table non disponible

## 📊 **Comportement selon l'état de la BDD**

| État table tasks_files | Comportement |
|----------------------|--------------|
| ✅ Existe et accessible | Lecture depuis tasks_files |
| 🟡 Existe mais vide | Fallback sur task.attachments |
| ❌ N'existe pas (404) | Fallback sur task.attachments |
| ⚠️ Erreur RLS/réseau | Fallback sur task.attachments |

## 🎯 **Points clés de compatibilité**

### ✅ **Preserved (non modifié)**
- Colonne `tasks.attachments` conservée
- Interface utilisateur identique
- Logique métier existante intacte
- Composants React non refactorisés

### 🆕 **Ajouté**
- Table `tasks_files` avec RLS
- Helper API avec fallback robuste
- Double écriture lors des uploads (tasks_files + attachments optionnel)
- Distinction visuelle 📎 vs 📷 dans l'UI

## 🧪 **Tests recommandés**

### Avant migration SQL
```bash
# L'app doit fonctionner avec les attachments existants
# GET /rest/v1/tasks_files?task_id=eq.XXX 
# -> doit retourner 404 et fallback fonctionne
```

### Après migration SQL  
```bash
# GET /rest/v1/tasks_files?task_id=eq.XXX
# -> doit retourner 200 avec []
# Upload de fichier -> doit créer ligne dans tasks_files
```

### Test de régression
```bash
# 1. Tâches existantes avec attachments -> documents visibles
# 2. Nouvelles tâches -> files dans tasks_files
# 3. Tâches mixtes -> union des deux sources
# 4. Tâches sans fichiers -> pas d'icône 📎
```

## 🚀 **Déploiement**

### Ordre recommandé :
1. **Deploy code** avec helper de fallback
2. **Vérifier** que l'app fonctionne (fallback actif)
3. **Exécuter migration SQL** sur Supabase  
4. **Tester** que les nouvelles données vont dans tasks_files
5. **Valider** que l'historique (attachments) reste accessible

### En cas de problème :
- Le code est rétrocompatible
- Suppression possible de la table tasks_files
- Fallback automatique sur attachments

## 📈 **Bénéfices**

- **Structure normalisée** pour les fichiers
- **Métadonnées complètes** (taille, type, date)
- **Requêtes optimisées** avec index
- **Sécurité RLS** appropriée
- **Compatibilité totale** avec l'existant