# Migration : Ajout de la colonne visible_for_assigned

## ⚠️ Action requise

Pour activer pleinement la fonctionnalité de transfert de documents avec contrôle de visibilité, vous devez exécuter le script SQL de migration.

## 📋 Étapes

### 1. Se connecter à Supabase

Allez sur : https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

### 2. Exécuter le script SQL

Copiez et exécutez le contenu du fichier :
```
sql/add_visible_for_assigned.sql
```

Ce script va :
- ✅ Ajouter la colonne `visible_for_assigned` (boolean, default: true)
- ✅ Créer un index pour optimiser les performances
- ✅ Mettre à jour la fonction `get_task_documents()`
- ✅ Ajouter un commentaire explicatif sur la colonne

### 3. Vérifier

Après l'exécution, vérifiez que la colonne existe :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks_files' 
AND column_name = 'visible_for_assigned';
```

Résultat attendu :
```
column_name           | data_type | column_default
----------------------|-----------|----------------
visible_for_assigned  | boolean   | true
```

## 🔧 Fonctionnement avant migration

Le code est compatible avec les bases qui n'ont pas encore cette colonne :
- ✅ Le transfert de documents fonctionne normalement
- ⚠️ L'option "Visible par l'assigné" n'a pas d'effet
- ⚠️ Tous les documents transférés sont visibles par défaut

## 🎯 Fonctionnement après migration

Une fois la migration effectuée :
- ✅ L'option "Visible par l'assigné" devient fonctionnelle
- ✅ Contrôle fin de la visibilité des documents transférés
- ✅ Documents existants restent visibles (default: true)

## 📝 Notes

- La migration est **rétrocompatible** (default: true)
- Aucune donnée n'est perdue
- Les documents existants restent accessibles
- Le code détecte automatiquement si la colonne existe
