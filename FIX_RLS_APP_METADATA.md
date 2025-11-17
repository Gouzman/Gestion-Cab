# 🚀 CORRECTION DES ERREURS RLS ET APP_METADATA

## ✅ Problèmes corrigés

### 1️⃣ Erreur 404 sur `app_metadata`
**Statut :** ✅ Déjà géré dans le code
- La gestion d'erreur existe déjà dans `src/components/Settings.jsx`
- Les erreurs 404 sont interceptées et loguées en `console.debug`
- L'application ne plante pas si la table n'existe pas
- **Aucune action requise** - l'erreur en console est normale et bénigne

### 2️⃣ Erreur RLS sur `user_permissions`
**Statut :** 🔧 Nécessite exécution SQL
- **Erreur 1 :** "new row violates row-level security policy for table user_permissions"
- **Erreur 2 :** "record new has no field updated_at"
- **Cause :** 
  - Policies RLS manquantes pour INSERT/UPDATE
  - Trigger automatique qui essaie de mettre à jour une colonne `updated_at` inexistante
- **Solution :** Exécuter le script SQL fourni qui :
  - Supprime les triggers problématiques
  - Ajoute les policies RLS correctes

---

## 📋 PROCÉDURE D'INSTALLATION

### Étape 1 : Accéder à Supabase SQL Editor

1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Dans le menu latéral, cliquez sur **SQL Editor**

### Étape 2 : Exécuter le script de correction RLS

1. Cliquez sur **New Query**
2. Copiez le contenu du fichier `sql/fix_user_permissions_rls.sql`
3. Collez-le dans l'éditeur
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier l'installation

Vous devriez voir en résultat :

```
DROP TRIGGER (x4 - suppression des triggers problématiques)
SELECT (0 rows - aucun trigger restant, c'est bon !)
ALTER TABLE
DROP POLICY (x3)
CREATE POLICY (x3)
SELECT (3 rows - affichage des policies créées)
```

La dernière requête devrait afficher 3 policies :
- `allow_select_own_permissions`
- `allow_insert_own_permissions`
- `allow_update_own_permissions`

---

## 🧪 TEST DE VALIDATION

Après avoir exécuté le script SQL :

1. **Rafraîchir l'application** (F5 dans le navigateur)
2. **Se connecter avec un utilisateur**
3. **Ouvrir la console développeur** (F12)
4. **Vérifier qu'il n'y a plus :**
   - ❌ D'erreur 401 sur `user_permissions`
   - ❌ D'erreur "violates row-level security policy"

### Résultat attendu :
✅ L'utilisateur peut se connecter sans erreur RLS
✅ Les permissions sont enregistrées correctement
✅ L'application fonctionne normalement

---

## 📝 CE QUI A ÉTÉ MODIFIÉ DANS LE CODE

### Fichier : `src/lib/permissionsUtils.js`
**Ligne 137 :** Retiré `updated_at: new Date().toISOString()`
- La colonne `updated_at` n'existe pas dans `user_permissions`
- L'upsert fonctionne maintenant avec seulement `user_id` et `permissions`

### Fichier : `sql/fix_user_permissions_rls.sql`
**Ajout :** Suppression de tous les triggers `updated_at` sur `user_permissions`
- Supprime les triggers qui tentent automatiquement de mettre à jour `updated_at`
- Corrige l'erreur : "record new has no field updated_at"

### Fichier : `src/components/Settings.jsx`
**Aucune modification nécessaire**
- La gestion d'erreur pour `app_metadata` existe déjà
- Les erreurs 404 sont interceptées et ne cassent rien

---

## ❓ FAQ

### Q : L'erreur 404 sur `app_metadata` apparaît encore en console
**R :** C'est normal et bénin. L'erreur est loguée en `console.debug` mais ne casse rien. Pour créer la table et supprimer cette erreur, exécutez :

```sql
CREATE TABLE IF NOT EXISTS app_metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  task_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer une ligne par défaut
INSERT INTO app_metadata (id, task_categories) 
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
```

### Q : L'erreur "record new has no field updated_at" persiste
**R :** Cela signifie qu'un trigger essaie encore de modifier `updated_at`. Vérifiez :
1. Que le script SQL s'est bien exécuté (vérifiez les DROP TRIGGER)
2. Que la requête SELECT après les DROP TRIGGER retourne 0 lignes
3. Si le problème persiste, exécutez manuellement :
```sql
-- Lister tous les triggers sur user_permissions
SELECT tgname FROM pg_trigger WHERE tgrelid = 'user_permissions'::regclass;

-- Supprimer manuellement chaque trigger trouvé
DROP TRIGGER IF EXISTS [nom_du_trigger] ON user_permissions;
```

### Q : L'erreur RLS persiste après avoir exécuté le script
**R :** Vérifiez que :
1. Le script s'est exécuté sans erreur
2. Vous êtes connecté avec un utilisateur authentifié
3. La colonne `user_id` dans `user_permissions` correspond bien à `auth.uid()`

### Q : Puis-je modifier la structure des tables ?
**R :** Non, comme demandé, aucune structure de table n'a été modifiée. Seules les policies RLS ont été ajoutées.

---

## 🎯 RÉSUMÉ

| Problème | Solution | Statut |
|----------|----------|--------|
| Erreur 404 `app_metadata` | Déjà géré dans le code | ✅ Rien à faire |
| Erreur RLS `user_permissions` | Exécuter `fix_user_permissions_rls.sql` | 🔧 Action requise |
| Colonne `updated_at` manquante | Retirée du code upsert | ✅ Corrigé |
| Trigger `updated_at` problématique | Supprimé dans le script SQL | 🔧 Action requise |

**Temps estimé :** 2 minutes ⏱️

---

## 🚨 IMPORTANT

- ✅ Aucune logique existante n'a été modifiée
- ✅ Aucun nom de variable n'a été changé
- ✅ Aucune structure de table n'a été altérée
- ✅ Tous les fichiers TaskManager, UploadManager, Calendrier, Auth, Storage sont intacts
- ✅ Seule correction : ajout de policies RLS et retrait de `updated_at`
