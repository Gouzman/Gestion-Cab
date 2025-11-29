# 🔐 INSTALLATION DU NOUVEAU SYSTÈME D'AUTHENTIFICATION

## ⚠️ IMPORTANT : À LIRE AVANT DE COMMENCER

Ce nouveau système d'authentification remplace **complètement** l'ancien système basé sur email/password avec validation par email. 

**Nouveau workflow :**
1. L'admin crée un utilisateur et génère un mot de passe initial
2. L'utilisateur reçoit ce mot de passe manuellement (via SMS, message, etc.)
3. Lors de la première connexion, l'utilisateur **doit obligatoirement** :
   - Définir son propre mot de passe sécurisé
   - Configurer sa phrase secrète (question/réponse)
4. Pour récupérer un mot de passe oublié : réponse à la phrase secrète (pas d'email)

---

## 📋 ÉTAPES D'INSTALLATION

### 1️⃣ Exécuter les scripts SQL

Dans l'ordre, exécutez ces fichiers SQL dans le **SQL Editor** de Supabase :

#### A. Créer les tables et structures
```sql
-- Fichier : sql/new_auth_system_setup.sql
-- Crée les tables : user_secret_phrases, password_history, login_attempts
-- Modifie la table profiles avec les nouveaux champs
```

**Action :** Ouvrez `sql/new_auth_system_setup.sql` et copiez-collez dans Supabase SQL Editor → Exécuter

#### B. Créer les fonctions RPC
```sql
-- Fichier : sql/new_auth_functions.sql
-- Crée les fonctions :
-- - generate_initial_password()
-- - check_must_change_password()
-- - set_personal_credentials()
-- - get_secret_question()
-- - verify_secret_answer_and_reset()
-- - log_login_attempt()
-- - create_collaborator_with_initial_password()
```

**Action :** Ouvrez `sql/new_auth_functions.sql` et copiez-collez dans Supabase SQL Editor → Exécuter

---

### 2️⃣ Vérifier les RLS (Row Level Security)

Assurez-vous que les policies RLS sont bien activées :

```sql
-- Vérifier dans Supabase Dashboard > Authentication > Policies
-- Tables concernées :
-- - user_secret_phrases
-- - password_history
-- - login_attempts
-- - profiles
```

---

### 3️⃣ Migrer les utilisateurs existants (OPTIONNEL)

Si vous avez déjà des utilisateurs dans le système, vous devez les migrer :

```sql
-- Mettre tous les utilisateurs en mode "doit changer son mot de passe"
UPDATE public.profiles
SET 
  must_change_password = true,
  has_custom_password = false
WHERE role != 'admin';

-- Les admins peuvent conserver leur accès
UPDATE public.profiles
SET 
  must_change_password = false,
  has_custom_password = true
WHERE role = 'admin';
```

**⚠️ ATTENTION :** Après cette migration, tous les utilisateurs non-admin devront définir leur mot de passe et phrase secrète lors de leur prochaine connexion.

---

### 4️⃣ Redémarrer l'application

```bash
cd /Users/gouzman/Documents/Gestion-Cab
npm run dev
```

---

## 🧪 TESTS D'ACCEPTATION

### Test 1 : Création d'un nouveau collaborateur

1. Connectez-vous en tant qu'**admin**
2. Allez dans **"Équipe"** (TeamManager)
3. Cliquez sur **"+ Nouveau collaborateur"**
4. Remplissez le formulaire et soumettez
5. ✅ **Résultat attendu :** Un toast s'affiche avec le **mot de passe initial généré**
6. Copiez ce mot de passe (vous avez 15 secondes)

---

### Test 2 : Première connexion utilisateur

1. Déconnectez-vous (ou ouvrez un autre navigateur)
2. Sur l'écran de connexion, saisissez :
   - **Identifiant :** l'email du collaborateur
   - **Mot de passe :** le mot de passe initial généré
3. Cliquez sur **"Connexion"**
4. ✅ **Résultat attendu :** Redirection automatique vers **FirstLoginScreen**
5. **Étape 1 :** Définissez un nouveau mot de passe sécurisé
   - Minimum 12 caractères
   - Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
6. Cliquez sur **"Continuer"**
7. **Étape 2 :** Configurez votre phrase secrète
   - Question : Ex. "Quel est le nom de votre premier animal ?"
   - Réponse : Ex. "Rex"
8. Cliquez sur **"Valider"**
9. ✅ **Résultat attendu :** 
   - Toast de confirmation
   - Connexion automatique
   - Redirection vers le **Dashboard**

---

### Test 3 : Connexion normale

1. Déconnectez-vous
2. Sur l'écran de connexion, saisissez :
   - **Identifiant :** email
   - **Mot de passe :** le mot de passe personnel (pas le générique)
3. Cliquez sur **"Connexion"**
4. ✅ **Résultat attendu :** Accès direct au **Dashboard** (pas de redirection)

---

### Test 4 : Mot de passe oublié

1. Sur l'écran de connexion, cliquez sur **"Mot de passe oublié ?"**
2. Saisissez votre **identifiant** (email)
3. Cliquez sur **"Continuer"**
4. ✅ **Résultat attendu :** Affichage de votre **question secrète**
5. Saisissez la **réponse**
6. Définissez un **nouveau mot de passe**
7. Confirmez le mot de passe
8. Cliquez sur **"Réinitialiser"**
9. ✅ **Résultat attendu :** 
   - Toast de confirmation
   - Retour automatique à l'écran de connexion
   - Possibilité de se connecter avec le nouveau mot de passe

---

### Test 5 : Réponse secrète incorrecte

1. Répétez le **Test 4** mais saisissez une **mauvaise réponse**
2. ✅ **Résultat attendu :** 
   - Toast d'erreur : "La réponse est incorrecte"
   - Pas de changement de mot de passe
   - Tentative enregistrée dans `login_attempts`

---

### Test 6 : Blocage mot de passe générique

1. Essayez de vous connecter avec le **mot de passe initial** après avoir défini un mot de passe personnel
2. ✅ **Résultat attendu :** 
   - Échec de connexion
   - Message : "Identifiant ou mot de passe incorrect"

---

### Test 7 : Historique des mots de passe

1. Lors de la définition d'un nouveau mot de passe (première connexion ou reset)
2. Essayez de réutiliser un **ancien mot de passe**
3. ✅ **Résultat attendu :** 
   - Toast d'erreur : "Ce mot de passe a déjà été utilisé"
   - Obligation de choisir un nouveau mot de passe

---

## 🔍 VÉRIFICATIONS TECHNIQUES

### Vérifier la base de données

```sql
-- 1. Vérifier qu'un utilisateur a bien un mot de passe initial
SELECT id, email, name, must_change_password, has_custom_password, initial_password IS NOT NULL as has_initial_pwd
FROM public.profiles
WHERE email = 'test@example.com';

-- 2. Vérifier qu'une phrase secrète a été créée
SELECT user_id, question_encrypted, created_at
FROM public.user_secret_phrases
WHERE user_id = 'USER_ID_HERE';

-- 3. Vérifier l'historique des mots de passe
SELECT user_id, created_at
FROM public.password_history
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- 4. Vérifier les tentatives de connexion
SELECT identifier, attempt_type, success, created_at
FROM public.login_attempts
WHERE identifier = 'test@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 MONITORING

### Tableau de bord admin - Login attempts

Vous pouvez créer une vue SQL pour monitorer les tentatives de connexion :

```sql
CREATE VIEW admin_login_monitoring AS
SELECT 
  l.identifier,
  l.attempt_type,
  l.success,
  l.created_at,
  l.error_message,
  p.name,
  p.role
FROM public.login_attempts l
LEFT JOIN public.profiles p ON p.email = l.identifier
ORDER BY l.created_at DESC
LIMIT 100;
```

---

## 🚨 DÉPANNAGE

### Problème : "User not found" lors de la connexion

**Cause :** L'utilisateur n'existe pas dans `profiles` ou `admin_approved = false`

**Solution :**
```sql
-- Vérifier l'existence
SELECT id, email, admin_approved FROM public.profiles WHERE email = 'USER_EMAIL';

-- Approuver l'utilisateur
UPDATE public.profiles SET admin_approved = true WHERE email = 'USER_EMAIL';
```

---

### Problème : "no_secret_phrase" lors du reset

**Cause :** L'utilisateur n'a jamais configuré sa phrase secrète

**Solution :** L'utilisateur doit se connecter avec son mot de passe actuel et reconfigurer sa phrase secrète via les paramètres (feature à implémenter)

---

### Problème : Mot de passe initial ne fonctionne pas

**Cause :** Le mot de passe initial a été supprimé après la première connexion

**Solution :**
```sql
-- Générer un nouveau mot de passe initial
SELECT public.generate_initial_password() as new_password;

-- Mettre à jour manuellement
UPDATE public.profiles
SET 
  must_change_password = true,
  has_custom_password = false,
  initial_password = crypt('NOUVEAU_MDP_ICI', gen_salt('bf'))
WHERE email = 'USER_EMAIL';

-- Mettre à jour dans auth.users
UPDATE auth.users
SET encrypted_password = crypt('NOUVEAU_MDP_ICI', gen_salt('bf'))
WHERE email = 'USER_EMAIL';
```

---

## ✅ CHECKLIST FINALE

- [ ] Scripts SQL exécutés avec succès
- [ ] RLS activé sur toutes les tables
- [ ] Test 1 : Création collaborateur ✓
- [ ] Test 2 : Première connexion ✓
- [ ] Test 3 : Connexion normale ✓
- [ ] Test 4 : Mot de passe oublié ✓
- [ ] Test 5 : Réponse incorrecte ✓
- [ ] Test 6 : Blocage mot de passe générique ✓
- [ ] Test 7 : Historique des mots de passe ✓
- [ ] Vérifications base de données ✓
- [ ] Monitoring mis en place ✓

---

## 🎉 FÉLICITATIONS !

Le nouveau système d'authentification est maintenant opérationnel !

**Points clés à retenir :**
- ✅ Pas d'envoi d'email automatique
- ✅ Mots de passe initiaux générés par l'admin
- ✅ Changement obligatoire à la première connexion
- ✅ Phrase secrète pour la récupération
- ✅ Historique des mots de passe
- ✅ Journalisation des tentatives de connexion

**Support :** En cas de problème, consultez les logs dans `login_attempts` ou contactez l'équipe technique.
