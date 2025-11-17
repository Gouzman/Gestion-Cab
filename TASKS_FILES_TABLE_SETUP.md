# 🔧 Guide de création de la table `tasks_files`

## 🎯 Problème

L'application affiche l'erreur suivante :
```
❌ 404 Could not find the table 'public.tasks_files' in the schema cache
```

Cela signifie que la table `tasks_files` n'existe pas encore dans votre base de données Supabase.

---

## ✅ Solution en 3 étapes

### **Étape 1 : Accéder au SQL Editor de Supabase**

1. Ouvrez votre navigateur et allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Dans le menu latéral gauche, cliquez sur **"SQL Editor"**

---

### **Étape 2 : Exécuter le script SQL**

1. Cliquez sur **"New query"** (ou "+ New")
2. Copiez **TOUT le contenu** du fichier suivant :
   ```
   sql/create_tasks_files_table_final.sql
   ```
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)

---

### **Étape 3 : Vérifier que tout fonctionne**

Vous devriez voir dans les résultats :

```
✅ Table tasks_files créée avec succès !
✅ RLS activé
✅ Policies configurées
✅ Index créés
✅ Cache PostgREST rechargé

🎯 Vous pouvez maintenant utiliser la table tasks_files depuis votre application.
```

---

## 🔍 Détails de la table créée

La table `tasks_files` contient les colonnes suivantes :

| Colonne       | Type          | Description                                    |
|---------------|---------------|------------------------------------------------|
| `id`          | `uuid`        | Identifiant unique du fichier (auto-généré)   |
| `task_id`     | `uuid`        | Référence vers la tâche (clé étrangère)       |
| `file_name`   | `text`        | Nom original du fichier                        |
| `file_url`    | `text`        | URL publique du fichier dans Supabase Storage |
| `file_type`   | `text`        | Type MIME du fichier (ex: image/png)          |
| `file_size`   | `bigint`      | Taille du fichier en octets                   |
| `created_at`  | `timestamptz` | Date de création (automatique)                |
| `created_by`  | `uuid`        | ID de l'utilisateur créateur (optionnel)      |

---

## 🔒 Politiques de sécurité (RLS)

Les politiques suivantes sont activées :

- ✅ **Lecture** : Tout le monde peut lire les fichiers
- ✅ **Insertion** : Tout le monde peut ajouter des fichiers
- ✅ **Mise à jour** : Tout le monde peut modifier les métadonnées
- ✅ **Suppression** : Tout le monde peut supprimer les fichiers

> **Note** : Ces politiques sont volontairement permissives pour faciliter le développement. 
> Vous pourrez les affiner plus tard selon vos besoins de sécurité.

---

## 📊 Index créés

Pour optimiser les performances, les index suivants ont été créés :

- `idx_tasks_files_task_id` : Accélère les requêtes par tâche
- `idx_tasks_files_created_at` : Accélère le tri par date
- `idx_tasks_files_created_by` : Accélère les requêtes par créateur

---

## 🚀 Prochaines étapes

Une fois le script exécuté avec succès :

1. **Rechargez votre application** (rafraîchir la page)
2. **Créez ou éditez une tâche**
3. **Ajoutez des fichiers** via les boutons "Choisir des fichiers" ou "Numériser"
4. **Vérifiez** que les fichiers apparaissent bien sous la tâche avec l'icône 📎

---

## ❓ En cas de problème

### Erreur : "relation tasks does not exist"

La table `tasks` n'existe pas dans votre base. Assurez-vous d'avoir créé la table des tâches avant.

### Erreur : "relation profiles does not exist"

La table `profiles` n'existe pas. Vous pouvez :
- Soit créer la table `profiles`
- Soit supprimer la contrainte `fk_tasks_files_created_by` du script

### L'erreur 404 persiste

1. Attendez 10-15 secondes (le cache met du temps à se rafraîchir)
2. Rechargez complètement votre navigateur (`Ctrl+Shift+R` / `Cmd+Shift+R`)
3. Vérifiez dans **Supabase Dashboard > Table Editor** que la table `tasks_files` apparaît bien

---

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes, vérifiez :

1. Que vous êtes connecté au bon projet Supabase
2. Que votre rôle utilisateur a les permissions nécessaires
3. Les logs d'erreur dans la console du navigateur (`F12`)
