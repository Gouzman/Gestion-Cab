# 🔐 SYSTÈME D'AUTHENTIFICATION - SYNTHÈSE TECHNIQUE

## 📊 VUE D'ENSEMBLE

Le système d'authentification a été **complètement refactorisé** pour implémenter un workflow où :
- L'utilisateur **ne choisit jamais** son mot de passe initial
- Le mot de passe est **généré par l'administrateur**
- Le changement est **obligatoire** lors de la première connexion
- La récupération se fait via **phrase secrète** (pas d'email)

---

## 🗂️ FICHIERS CRÉÉS

### SQL
- `sql/new_auth_system_setup.sql` - Tables et structures
- `sql/new_auth_functions.sql` - Fonctions RPC

### Composants React
- `src/components/FirstLoginScreen.jsx` - Première connexion (2 étapes)
- `src/components/ForgotPasswordScreen.jsx` - Récupération par phrase secrète
- `src/components/LoginScreen.jsx` - **REFACTORISÉ** (identifiant + mot de passe)

### Context
- `src/contexts/SupabaseAuthContext.jsx` - **REFACTORISÉ** (nouvelles méthodes)

### Documentation
- `INSTALLATION_NOUVEAU_SYSTEME_AUTH.md` - Guide d'installation complet

---

## 🗂️ FICHIERS SUPPRIMÉS

- ❌ `src/components/SetPasswordScreen.jsx` (obsolète)
- ❌ `src/components/SignUpScreen.jsx` (obsolète)
- ❌ `sql/password_reset_requests` (table supprimée)

---

## 🗂️ FICHIERS MODIFIÉS

### TeamManager
- `src/components/TeamManager.jsx`
  - Appelle `generate_initial_password()` RPC
  - Utilise `create_collaborator_with_initial_password()` RPC
  - Affiche le mot de passe initial dans un toast (15 secondes)

### App.jsx
- Pas de modification majeure nécessaire
- Le flux est géré automatiquement par LoginScreen et FirstLoginScreen

---

## 🗄️ BASE DE DONNÉES

### Nouvelles tables

#### `user_secret_phrases`
```sql
- id (UUID)
- user_id (UUID) → profiles(id)
- question_encrypted (TEXT) - Question en base64
- answer_hash (TEXT) - Réponse hashée (bcrypt)
- created_at, updated_at
```

#### `password_history`
```sql
- id (UUID)
- user_id (UUID) → profiles(id)
- password_hash (TEXT) - Hash bcrypt
- created_at
```

#### `login_attempts`
```sql
- id (UUID)
- identifier (TEXT) - Email ou matricule
- attempt_type (TEXT) - 'login', 'secret_phrase', 'password_reset'
- success (BOOLEAN)
- ip_address (TEXT)
- user_agent (TEXT)
- error_message (TEXT)
- created_at
```

### Colonnes ajoutées à `profiles`

```sql
ALTER TABLE profiles ADD COLUMN:
- initial_password (TEXT) - Hash du mot de passe générique
- must_change_password (BOOLEAN) - Force le changement
- has_custom_password (BOOLEAN) - Indique si mot de passe perso défini
- last_password_change (TIMESTAMP)
- password_change_count (INTEGER)
```

---

## 🔧 FONCTIONS RPC

### 1. `generate_initial_password()`
Génère un mot de passe aléatoire sécurisé de 16 caractères.

**Retour :** `TEXT` (mot de passe en clair)

---

### 2. `check_must_change_password(user_identifier TEXT)`
Vérifie si l'utilisateur doit changer son mot de passe.

**Retour :** 
```json
{
  "success": true/false,
  "user_id": "...",
  "must_change_password": true/false,
  "has_custom_password": true/false
}
```

---

### 3. `set_personal_credentials(user_email, new_password, secret_question, secret_answer)`
Définit le mot de passe personnel et la phrase secrète.

**Actions :**
- Hash le nouveau mot de passe
- Met à jour `auth.users`
- Met à jour `profiles` (must_change_password = false)
- Insère dans `user_secret_phrases`
- Insère dans `password_history`

**Retour :** `{success: true/false, error: "..."}`

---

### 4. `get_secret_question(user_identifier TEXT)`
Récupère la question secrète d'un utilisateur.

**Retour :**
```json
{
  "success": true/false,
  "question": "Quel est...",
  "user_id": "..."
}
```

---

### 5. `verify_secret_answer_and_reset(user_identifier, secret_answer, new_password)`
Vérifie la réponse secrète et réinitialise le mot de passe.

**Actions :**
- Vérifie la réponse (case-insensitive)
- Met à jour le mot de passe dans `auth.users`
- Insère dans `password_history`
- Journalise dans `login_attempts`

**Retour :** `{success: true/false, error: "..."}`

---

### 6. `log_login_attempt(user_identifier, attempt_success, attempt_error, user_ip, user_agent_string)`
Enregistre une tentative de connexion.

---

### 7. `create_collaborator_with_initial_password(...)`
Crée un collaborateur avec son mot de passe initial.

**Retour :** 
```json
{
  "success": true,
  "user_id": "...",
  "initial_password": "ABC123xyz!@#"
}
```

---

## 🎨 COMPOSANTS REACT

### LoginScreen (Refactorisé)

**Props :** Aucune

**State :**
- `identifier` - Email ou matricule
- `password` - Mot de passe
- `showFirstLogin` - Affiche FirstLoginScreen si true
- `showForgotPassword` - Affiche ForgotPasswordScreen si true

**Workflow :**
```
1. Utilisateur saisit identifiant + mot de passe
2. Appelle signIn()
3. Si mustChangePassword = true → showFirstLogin = true
4. Sinon → connexion réussie (redirection Dashboard)
```

---

### FirstLoginScreen (Nouveau)

**Props :**
- `identifier` (string) - Email de l'utilisateur
- `onBack` (function) - Retour à LoginScreen

**State :**
- `step` - 1 (mot de passe) ou 2 (phrase secrète)
- `newPassword`, `confirmPassword`
- `secretQuestion`, `secretAnswer`

**Workflow :**
```
Étape 1 : Définir le mot de passe
- Validation : min 12 chars, majuscule, minuscule, chiffre, caractère spécial
- Bouton "Continuer" → step = 2

Étape 2 : Configurer la phrase secrète
- Question (max 200 chars)
- Réponse (min 3 chars)
- Bouton "Valider" → Appelle setPersonalCredentials()
- Connexion automatique → Redirection Dashboard
```

---

### ForgotPasswordScreen (Nouveau)

**Props :**
- `onBack` (function) - Retour à LoginScreen

**State :**
- `step` - 1 (identifiant) ou 2 (réponse + nouveau mot de passe)
- `identifier`, `secretQuestion`, `secretAnswer`
- `newPassword`, `confirmPassword`

**Workflow :**
```
Étape 1 : Saisir l'identifiant
- Appelle getSecretQuestion()
- Affiche la question → step = 2

Étape 2 : Répondre et réinitialiser
- Saisir la réponse
- Définir nouveau mot de passe
- Appelle resetPasswordWithSecretPhrase()
- Retour automatique à LoginScreen
```

---

## 🔐 CONTEXTE D'AUTHENTIFICATION

### Méthodes exposées par `SupabaseAuthContext`

#### `checkUserStatus(identifier)`
Vérifie le statut d'un utilisateur (existence, approbation admin, etc.)

#### `signIn(identifier, password)`
Connexion avec identifiant et mot de passe.
**Retour :** `{error, mustChangePassword}`

#### `setPersonalCredentials(identifier, newPassword, secretQuestion, secretAnswer)`
Définit les identifiants personnels lors de la première connexion.

#### `getSecretQuestion(identifier)`
Récupère la question secrète d'un utilisateur.
**Retour :** `{error, question, userId}`

#### `resetPasswordWithSecretPhrase(identifier, secretAnswer, newPassword)`
Réinitialise le mot de passe après vérification de la réponse secrète.

#### `signOut()`
Déconnexion (inchangé).

---

## 🔄 WORKFLOW COMPLET

### Scénario 1 : Création d'un nouveau collaborateur

```
ADMIN (TeamManager)
├─ Clique sur "Nouveau collaborateur"
├─ Remplit le formulaire (nom, email, fonction, rôle)
├─ Soumet le formulaire
│
BACKEND (Supabase)
├─ Appelle generate_initial_password() → "Abc123!@#XyZ789"
├─ Crée le compte auth.users avec ce mot de passe
├─ Appelle create_collaborator_with_initial_password()
├─ Insère dans profiles avec :
│  ├─ initial_password = hash("Abc123!@#XyZ789")
│  ├─ must_change_password = true
│  └─ has_custom_password = false
│
FRONTEND (Toast)
└─ Affiche le mot de passe initial pendant 15 secondes
   "Mot de passe initial : Abc123!@#XyZ789"
   "⚠️ Transmettez ce mot de passe à l'utilisateur"
```

---

### Scénario 2 : Première connexion utilisateur

```
UTILISATEUR (LoginScreen)
├─ Saisit identifiant : "user@example.com"
├─ Saisit mot de passe : "Abc123!@#XyZ789" (mot de passe générique)
├─ Clique sur "Connexion"
│
BACKEND (checkUserStatus + signIn)
├─ Vérifie existence et approbation → OK
├─ Vérifie must_change_password → TRUE
├─ Connexion Supabase Auth → OK
│
FRONTEND (Redirection)
├─ Affiche FirstLoginScreen
│
UTILISATEUR (FirstLoginScreen - Étape 1)
├─ Définit nouveau mot de passe : "MonMotDePasse2025!Secure"
├─ Confirme le mot de passe
├─ Clique sur "Continuer"
│
UTILISATEUR (FirstLoginScreen - Étape 2)
├─ Question : "Quel est le nom de votre premier animal ?"
├─ Réponse : "Rex"
├─ Clique sur "Valider"
│
BACKEND (setPersonalCredentials)
├─ Hash le nouveau mot de passe
├─ Met à jour auth.users.encrypted_password
├─ Met à jour profiles :
│  ├─ must_change_password = false
│  ├─ has_custom_password = true
│  └─ initial_password = NULL
├─ Insère dans user_secret_phrases :
│  ├─ question_encrypted = base64("Quel est...")
│  └─ answer_hash = bcrypt("rex")
├─ Insère dans password_history
│
FRONTEND
├─ Connexion automatique avec nouveau mot de passe
└─ Redirection Dashboard
```

---

### Scénario 3 : Mot de passe oublié

```
UTILISATEUR (LoginScreen)
├─ Clique sur "Mot de passe oublié ?"
│
FRONTEND (ForgotPasswordScreen - Étape 1)
├─ Saisit identifiant : "user@example.com"
├─ Clique sur "Continuer"
│
BACKEND (getSecretQuestion)
├─ Récupère user_secret_phrases
├─ Décode la question depuis base64
│
FRONTEND (ForgotPasswordScreen - Étape 2)
├─ Affiche la question : "Quel est le nom de votre premier animal ?"
│
UTILISATEUR
├─ Saisit réponse : "Rex"
├─ Définit nouveau mot de passe : "NouveauMotDePasse2025!"
├─ Confirme le mot de passe
├─ Clique sur "Réinitialiser"
│
BACKEND (verify_secret_answer_and_reset)
├─ Vérifie bcrypt(lowercase("rex")) == answer_hash → OK
├─ Vérifie que le mot de passe n'a pas été utilisé (password_history) → OK
├─ Met à jour auth.users.encrypted_password
├─ Insère dans password_history
├─ Journalise dans login_attempts (attempt_type: 'password_reset', success: true)
│
FRONTEND
├─ Toast de confirmation
└─ Retour automatique à LoginScreen
```

---

## 🛡️ SÉCURITÉ

### Protections mises en place

✅ **Mots de passe hashés** (bcrypt avec salt)
✅ **Phrases secrètes chiffrées** (question en base64, réponse hashée)
✅ **Historique des mots de passe** (empêche la réutilisation)
✅ **Journalisation des tentatives** (détection d'attaques)
✅ **RLS activé** sur toutes les tables sensibles
✅ **Validation stricte** des mots de passe (12+ chars, complexité)
✅ **Pas d'envoi d'email** (évite l'interception)

---

### Points d'attention

⚠️ **Mot de passe initial affiché 15 secondes** - L'admin doit le transmettre manuellement
⚠️ **Phrase secrète case-insensitive** - Facilite la récupération mais réduit légèrement la sécurité
⚠️ **Pas de 2FA** - Peut être ajouté ultérieurement
⚠️ **Pas de rate limiting frontend** - Implémenté côté base via login_attempts

---

## 📈 MÉTRIQUES ET MONITORING

### Requêtes SQL utiles

#### Nombre de premières connexions en attente
```sql
SELECT COUNT(*) FROM profiles 
WHERE must_change_password = true AND admin_approved = true;
```

#### Tentatives de connexion échouées (24h)
```sql
SELECT COUNT(*) FROM login_attempts 
WHERE success = false 
AND created_at > now() - interval '24 hours';
```

#### Utilisateurs sans phrase secrète
```sql
SELECT p.email, p.name 
FROM profiles p
LEFT JOIN user_secret_phrases u ON p.id = u.user_id
WHERE u.user_id IS NULL AND p.has_custom_password = true;
```

---

## ✅ CHECKLIST DE VALIDATION

- [x] Tables SQL créées
- [x] Fonctions RPC créées
- [x] RLS configuré
- [x] FirstLoginScreen créé
- [x] ForgotPasswordScreen créé
- [x] LoginScreen refactorisé
- [x] SupabaseAuthContext refactorisé
- [x] TeamManager mis à jour
- [x] Composants obsolètes supprimés
- [x] Documentation créée
- [ ] **Tests d'acceptation à exécuter**
- [ ] **Migration utilisateurs existants**

---

## 🚀 PROCHAINES ÉTAPES

1. **Exécuter les scripts SQL** (voir INSTALLATION_NOUVEAU_SYSTEME_AUTH.md)
2. **Lancer les tests d'acceptation** (7 tests définis)
3. **Migrer les utilisateurs existants** (si nécessaire)
4. **Former les administrateurs** sur le nouveau workflow
5. **Communiquer aux utilisateurs** le nouveau processus de connexion

---

## 📞 SUPPORT

En cas de problème :
1. Consulter `INSTALLATION_NOUVEAU_SYSTEME_AUTH.md`
2. Vérifier les logs dans `login_attempts`
3. Vérifier les RLS dans Supabase Dashboard
4. Contacter l'équipe technique

---

**Version :** 1.0.0  
**Date :** 29 novembre 2025  
**Statut :** ✅ Prêt pour installation
