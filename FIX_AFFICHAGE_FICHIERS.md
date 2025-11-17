# ✅ FIX : Affichage des fichiers en base

## 🐛 Problème Identifié

Les fichiers enregistrés dans la table `tasks_files` ne s'affichaient pas dans l'application car la requête chargeait uniquement les IDs (`task_id, id`) au lieu des données complètes.

## ✅ Correction Appliquée

**Fichier modifié :** `src/components/TaskManager.jsx`

**Ligne ~111-127** : Changement de la requête de chargement des fichiers

### Avant (❌ Incomplet)
```javascript
.select('task_id, id')  // ❌ Seulement les IDs
```

### Après (✅ Complet)
```javascript
.select('*')  // ✅ Toutes les colonnes (file_name, file_url, file_size, etc.)
```

## 🎯 Ce qui a été corrigé

1. **Chargement initial des tâches** : Les fichiers sont maintenant chargés avec toutes leurs données
2. **Affichage des fichiers** : file_name, file_url, file_size sont maintenant disponibles
3. **Icône document** : Le compteur affiche le bon nombre de fichiers
4. **Section Documents** : Les fichiers s'affichent correctement avec leur nom et taille

## ✅ Test de Vérification

1. **Rafraîchir l'application** (F5)
2. **Vérifier dans la console du navigateur** :
   ```javascript
   // Aucune erreur de type "undefined file_name" ou "undefined file_url"
   ```
3. **Cliquer sur l'icône 📎** d'une tâche avec fichiers
4. **Vérifier que les fichiers apparaissent** avec :
   - ✅ Nom du fichier
   - ✅ Taille du fichier
   - ✅ Bouton "Prévisualiser"

## 📊 Structure des Données Chargées

```javascript
{
  id: "uuid",
  task_id: "uuid",
  file_name: "document.pdf",
  file_url: "https://...supabase.co/storage/v1/object/public/attachments/...",
  file_size: 123456,
  file_type: "application/pdf",
  created_at: "2025-11-13T...",
  created_by: "uuid",
  source: "tasks_files",
  is_accessible: true,
  valid_url: "https://..."
}
```

## 🚨 Important

**✅ Aucune autre modification nécessaire**  
**✅ Le code de chargement (`getTaskFiles`) reste inchangé**  
**✅ Le code d'affichage reste inchangé**  
**✅ Seule la requête initiale a été corrigée**

## 🔍 Si les fichiers ne s'affichent toujours pas

1. **Vérifier que les fichiers existent dans Supabase** :
   - Aller dans Supabase Dashboard > Table Editor > tasks_files
   - Vérifier qu'il y a des lignes avec `file_url` non vide

2. **Vérifier les policies RLS** :
   - Exécuter `sql/fix_all_rls_and_bucket.sql` si pas déjà fait

3. **Vérifier dans la console** :
   ```javascript
   // Ouvrir DevTools > Console
   // Rechercher des erreurs contenant "tasks_files"
   ```

4. **Forcer le rechargement des fichiers** :
   - Cliquer sur l'icône 📎 d'une tâche
   - Les fichiers devraient se charger dynamiquement

---

**Créé le : 13 novembre 2025**  
**Status : ✅ Corrigé**  
**Temps de correction : < 1 minute**
