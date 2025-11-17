# 🧪 Guide de Test - Système de Permissions "Gérant"

## 🎯 Objectif
Tester que seul le compte "Gérant" peut créer et attribuer les droits aux utilisateurs depuis l'onglet "Paramètres > Gestion des Permissions".

## 📋 Prérequis

### 1. Base de données configurée
Exécutez d'abord le script SQL dans Supabase :
```sql
-- Voir le fichier: /sql/fix_permissions_structure.sql
```

### 2. Application démarrée
```bash
npm run dev
# Application disponible sur http://localhost:3001
```

## 🧪 Tests à effectuer

### Test 1 : Accès autorisé (Gérant)
**Objectif** : Vérifier que le Gérant peut accéder à la gestion des permissions

1. **Se connecter avec le compte Gérant**
   - Email : `admin@gestion-cabinet.com`
   - Ce compte a `role: 'admin'` et `function: 'Gerant'`

2. **Naviguer vers Paramètres**
   - Cliquer sur l'onglet "Paramètres" dans la sidebar
   - ✅ **Résultat attendu** : L'accès est autorisé

3. **Vérifier la section Gestion des Permissions**
   - ✅ **Résultat attendu** : Section "Gestion des Permissions" visible
   - ✅ **Résultat attendu** : Liste des utilisateurs affichée
   - ✅ **Résultat attendu** : Bouton "Nouvel utilisateur" visible

### Test 2 : Accès refusé (Avocat)
**Objectif** : Vérifier qu'un avocat ne peut pas accéder aux paramètres

1. **Créer et se connecter avec un compte Avocat**
   - Utiliser `avocat1@cabinet.com` (première connexion)
   - Définir un mot de passe lors de la première connexion

2. **Tenter d'accéder aux Paramètres**
   - Cliquer sur l'onglet "Paramètres"
   - ✅ **Résultat attendu** : Message "Accès non autorisé"
   - ✅ **Résultat attendu** : Affichage du rôle actuel de l'utilisateur

### Test 3 : Gestion des permissions (Gérant uniquement)
**Objectif** : Tester les fonctionnalités de gestion des permissions

1. **Se connecter en tant que Gérant**

2. **Sélectionner un utilisateur**
   - Cliquer sur un utilisateur dans la liste
   - ✅ **Résultat attendu** : Informations utilisateur affichées
   - ✅ **Résultat attendu** : Formulaire de permissions visible

3. **Modifier le rôle d'un utilisateur**
   - Changer le rôle d'un utilisateur (ex: de "user" à "avocat")
   - Cliquer "Sauvegarder les Permissions"
   - ✅ **Résultat attendu** : Message de succès
   - ✅ **Résultat attendu** : Rôle mis à jour dans la base

4. **Modifier les permissions d'un module**
   - Décocher "Module visible" pour un module
   - Sauvegarder
   - ✅ **Résultat attendu** : Permissions sauvées
   - ✅ **Résultat attendu** : Actions du module désactivées automatiquement

5. **Modifier des actions spécifiques**
   - Cocher/décocher des actions (créer, modifier, supprimer)
   - Sauvegarder
   - ✅ **Résultat attendu** : Actions mises à jour

### Test 4 : Persistance des données
**Objectif** : Vérifier que les changements sont sauvegardés

1. **Modifier des permissions et se déconnecter**
2. **Se reconnecter**
3. **Vérifier les paramètres**
   - ✅ **Résultat attendu** : Les modifications sont conservées

## 🔍 Points de vérification spécifiques

### Contrôles d'accès
- [ ] Seuls les utilisateurs avec `role: 'admin'` ou `role: 'gerant'` peuvent accéder
- [ ] Seuls les utilisateurs avec `function: 'Gerant'` peuvent accéder
- [ ] Les autres rôles voient un message d'erreur explicite

### Interface utilisateur
- [ ] Liste des utilisateurs chargée dynamiquement
- [ ] Informations utilisateur affichées correctement
- [ ] Sélection d'utilisateur fonctionnelle
- [ ] Formulaire de rôle/fonction fonctionnel
- [ ] Checkboxes de permissions réactives

### Fonctionnalités backend
- [ ] Sauvegarde dans `user_permissions` fonctionne
- [ ] Mise à jour dans table `users` fonctionne  
- [ ] Gestion d'erreurs appropriée
- [ ] Messages de retour informatifs

### Base de données
- [ ] Table `users` contient les bons rôles
- [ ] Table `user_permissions` contient les permissions JSON
- [ ] Politiques RLS appliquées correctement

## 🚨 Cas d'erreur à tester

### Test d'erreur 1 : Utilisateur inexistant
1. Modifier manuellement l'ID utilisateur dans la base
2. Essayer de sauvegarder des permissions
3. ✅ **Résultat attendu** : Message d'erreur approprié

### Test d'erreur 2 : Permissions malformées
1. Insérer des permissions JSON invalides dans la base
2. Essayer de charger l'utilisateur
3. ✅ **Résultat attendu** : Fallback vers permissions par défaut

### Test d'erreur 3 : Connexion base de données
1. Modifier temporairement les credentials Supabase
2. Essayer d'accéder aux permissions
3. ✅ **Résultat attendu** : Message d'erreur réseau approprié

## 📊 Validation des permissions par défaut

Vérifiez que les permissions par défaut sont appliquées selon le rôle :

### Admin/Gérant
- Tous les modules visibles ✅
- Toutes les actions autorisées ✅

### Avocat  
- Modules métier visibles (tasks, clients, cases, calendar, documents, reports) ✅
- Pas d'accès billing, team, settings ❌
- Actions limitées (pas de delete sur la plupart) ⚠️

### Secrétaire
- Modules de support visibles (tasks, clients, calendar, documents, reports) ✅
- Pas d'accès cases, billing, team, settings ❌
- Actions très limitées ⚠️

### User
- Accès minimal (dashboard, calendar en lecture seule) ✅
- Aucune action de modification ❌

## 🎉 Critères de réussite

Le test est réussi si :
1. ✅ Seuls les Gérants peuvent accéder aux Paramètres
2. ✅ L'interface de gestion des permissions s'affiche correctement
3. ✅ Les modifications de rôles/permissions sont sauvegardées
4. ✅ Les autres utilisateurs voient le message d'accès refusé
5. ✅ Les permissions par défaut sont appliquées selon les rôles
6. ✅ Les erreurs sont gérées gracieusement

---
**Une fois tous ces tests passés, le système de permissions est fonctionnel ! 🎊**