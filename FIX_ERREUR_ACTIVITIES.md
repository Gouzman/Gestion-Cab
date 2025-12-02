# 🔧 FIX : Erreur Foreign Key activities

**Erreur** : `insert or update on table "activities" violates foreign key constraint "activities_user_id_fkey"`

**Cause** : Un trigger tente d'insérer dans la table `activities` avec un `user_id` qui n'existe pas dans la table `profiles`.

---

## ✅ Solution Rapide

### Étape 1 : Exécuter le script de fix

Dans **Supabase SQL Editor**, exécuter :

```sql
-- Supprimer le trigger problématique
DROP TRIGGER IF EXISTS trigger_check_convention_expiration ON clients;
DROP FUNCTION IF EXISTS check_convention_expiration();
```

### Étape 2 : Nettoyer les données (si nécessaire)

Si des enregistrements `activities` orphelins existent :

```sql
-- Vérifier
SELECT COUNT(*) 
FROM activities a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.user_id IS NOT NULL AND p.id IS NULL;

-- Supprimer les orphelins (si COUNT > 0)
DELETE FROM activities 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);
```

### Étape 3 : Vider le cache navigateur

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## 📋 Scripts disponibles

1. **`sql/fix_convention_trigger.sql`** - Supprime uniquement le trigger
2. **`sql/fix_activities_foreign_key.sql`** - Diagnostic complet + fix

---

## ℹ️ Explications

Le trigger `check_convention_expiration()` tentait de créer des alertes automatiques dans la table `activities` lorsqu'une convention approchait de sa date d'expiration.

**Problème** : 
- La table `clients` n'a pas de colonne `created_by`
- Le trigger utilisait `NEW.created_by` qui n'existe pas
- Cela causait des erreurs 500

**Solution** :
- Trigger désactivé
- Les alertes d'expiration sont maintenant affichées dans le `ConventionDashboard`
- Pas de perte de fonctionnalité pour l'utilisateur

---

## ✅ Vérification

Après avoir exécuté le fix :

```sql
-- Vérifier qu'il n'y a plus de trigger
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'clients' 
AND trigger_name = 'trigger_check_convention_expiration';
-- Résultat attendu : 0 ligne

-- Vérifier les FK de activities
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'activities' 
AND constraint_type = 'FOREIGN KEY';
-- Doit afficher : activities_user_id_fkey
```

---

## 🚀 Redémarrage

1. Recharger l'application : `Ctrl+Shift+R`
2. Les erreurs 500 et 409 doivent disparaître
3. Le système de conventions fonctionne normalement

---

**Statut** : ✅ Fix prêt  
**Impact** : Aucune perte de fonctionnalité  
**Alertes** : Gérées visuellement dans ConventionDashboard
