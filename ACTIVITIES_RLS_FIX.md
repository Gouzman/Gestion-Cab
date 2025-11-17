# CORRECTION URGENTE : Erreur RLS Activities

## ❌ Problème
```
POST https://fhuzkubnxuetakpxkwlr.supabase.co/rest/v1/tasks 401 (Unauthorized)
Error: "new row violates row-level security policy for table activities"
```

## ✅ Solution (3 options)

### Option 1 : Script SQL automatique (RECOMMANDÉ - 30 secondes)

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu du fichier : `sql/create_fix_activities_rls_function.sql`
3. Cliquez sur **Run**
4. ✅ Le problème est résolu automatiquement

### Option 2 : Script SQL rapide (RAPIDE - 10 secondes)

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu du fichier : `sql/fix_activities_rls_quick.sql`
3. Cliquez sur **Run**
4. ✅ Essayez de créer une tâche

### Option 3 : Correction manuelle (si les scripts ne marchent pas)

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Exécutez cette commande simple :

```sql
-- Désactiver RLS sur activities (solution temporaire)
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;
```

OU (solution plus sécurisée) :

```sql
-- Créer une policy permissive
CREATE POLICY "Allow all inserts to activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (true);
```

## 🔍 Vérification

Après avoir exécuté une des solutions ci-dessus :

1. Rafraîchissez votre application
2. Essayez de créer une nouvelle tâche
3. ✅ L'erreur devrait avoir disparu

## 📝 Explication technique

Le problème vient d'un **trigger Supabase** qui tente d'enregistrer automatiquement les activités dans la table `activities` lorsqu'une tâche est créée. La table `activities` a Row Level Security (RLS) activé, mais aucune policy ne permet aux triggers d'insérer des données.

**Solution** : Ajouter une policy permissive qui autorise tous les inserts dans la table `activities`.

## 🚀 Pour aller plus loin

Si vous voulez une solution automatique qui s'exécute au démarrage de l'application :

1. La fonction `fix_activities_rls_policy()` a été créée (voir `sql/create_fix_activities_rls_function.sql`)
2. Elle sera appelée automatiquement au démarrage de l'app via `initializeAppInfrastructure()`
3. Cela corrige le problème sans intervention manuelle

---

**Besoin d'aide ?** Vérifiez que la table `activities` existe bien dans votre base Supabase.
