# 🔧 Solution FK Constraint profiles → users

## ❌ Problème
Erreur : `insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"`

**Cause** : `profiles.id` a une contrainte FK vers `users.id`, mais la table `users` n'est pas alimentée automatiquement quand on crée un compte Auth.

## ✅ Solution : Trigger automatique

### Étapes

1. **Ouvrir Supabase SQL Editor**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet
   - Menu : SQL Editor

2. **Exécuter le script**
   - Copier tout le contenu de `sql/fix_users_trigger.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"

3. **Vérification**
   ```sql
   -- Vérifier que users existe
   SELECT * FROM public.users LIMIT 5;
   
   -- Vérifier le trigger
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

## 📋 Ce que fait le script

1. ✅ Crée la table `users` avec FK vers `auth.users`
2. ✅ Active RLS sur `users`
3. ✅ Crée des politiques (lecture publique, insertion admin)
4. ✅ Crée une fonction trigger `handle_new_auth_user()`
5. ✅ Attache le trigger à `auth.users` (AFTER INSERT)
6. ✅ Remplit `users` avec les comptes Auth existants

## 🎯 Résultat

Après avoir exécuté ce script :
- ✅ Chaque fois qu'un compte Auth est créé via `supabase.auth.signUp()`, une ligne est **automatiquement insérée** dans `users`
- ✅ La contrainte FK `profiles_id_fkey` est satisfaite
- ✅ Vous pouvez créer des collaborateurs sans erreur 409

## 🧪 Test

Après l'exécution du script, testez la création d'un collaborateur dans TeamManager :
1. Cliquer sur "Ajouter un membre"
2. Remplir le formulaire
3. Soumettre
4. ✅ Le collaborateur doit être créé sans erreur FK
