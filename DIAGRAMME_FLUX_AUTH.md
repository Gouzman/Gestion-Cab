# 🔄 DIAGRAMME DE FLUX : NOUVEAU SYSTÈME D'AUTHENTIFICATION

## Flux Complet (Sans Approbation Admin)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRÉATION D'UTILISATEUR PAR ADMIN                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Admin crée utilisateur   │
                    │  - Email / Matricule      │
                    │  - Mot de passe générique │
                    │  - Nom, rôle, fonction    │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Compte créé avec :       │
                    │  ✅ admin_approved = TRUE │
                    │  ✅ must_change = TRUE    │
                    │  ✅ Actif immédiatement   │
                    └───────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    PREMIÈRE CONNEXION UTILISATEUR                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  LoginScreen              │
                    │  - Saisie identifiant     │
                    │  - Saisie mot de passe    │
                    │    (générique)            │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Appel internal_login()   │
                    │  1. ✅ User trouvé        │
                    │  2. ✅ Pas de vérif admin │
                    │  3. ✅ Mot de passe OK    │
                    │  4. ✅ Session créée      │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  InternalAuthContext      │
                    │  - user défini            │
                    │  - mustChangePassword ✅  │
                    │  - session active         │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  App.jsx détecte          │
                    │  mustChangePassword=true  │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  FirstLoginScreen         │
                    │  ┌─────────────────────┐  │
                    │  │ Première connexion  │  │
                    │  │ ─────────────────── │  │
                    │  │ 1️⃣ Mot de passe     │  │
                    │  │    - Saisie nouveau │  │
                    │  │    - Confirmation   │  │
                    │  │    - Validation     │  │
                    │  │                     │  │
                    │  │ 2️⃣ Phrase secrète   │  │
                    │  │    - Question       │  │
                    │  │    - Réponse        │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  setPersonalCredentials   │
                    │  - Sauvegarde nouveau MDP │
                    │  - Sauvegarde phrase      │
                    │  - must_change = FALSE    │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Reconnexion auto avec    │
                    │  nouveau mot de passe     │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  🎉 Dashboard accessible  │
                    └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONNEXIONS SUIVANTES                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  LoginScreen              │
                    │  - Saisie identifiant     │
                    │  - Saisie MDP personnel   │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Appel internal_login()   │
                    │  1. ✅ User trouvé        │
                    │  2. ✅ Pas de vérif admin │
                    │  3. ✅ Mot de passe OK    │
                    │  4. ✅ Session créée      │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  mustChangePassword = ❌   │
                    │  (déjà changé)            │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  🎉 Dashboard accessible  │
                    │     (direct, sans écran)  │
                    └───────────────────────────┘
```

---

## Comparaison Avant / Après

### ❌ ANCIEN SYSTÈME (Avec approbation)

```
Admin crée user
    ↓
Compte en attente (admin_approved = FALSE)
    ↓
User essaie de se connecter
    ↓
❌ Erreur : "Votre compte est en attente de validation"
    ↓
User attend...
    ↓
Admin approuve manuellement (admin_approved = TRUE)
    ↓
User se connecte
    ↓
FirstLoginScreen (changement MDP)
    ↓
Dashboard
```

### ✅ NOUVEAU SYSTÈME (Sans approbation)

```
Admin crée user
    ↓
Compte actif immédiatement (admin_approved = TRUE)
    ↓
User se connecte avec MDP générique
    ↓
✅ Connexion réussie
    ↓
FirstLoginScreen (changement MDP)
    ↓
Dashboard
```

---

## Points Clés

### 🔐 Sécurité Maintenue
- ✅ Validation complexe du mot de passe (12 caractères, majuscule, minuscule, chiffre, spécial)
- ✅ Phrase secrète obligatoire pour récupération
- ✅ Historique des mots de passe (pas de réutilisation)
- ✅ Sessions sécurisées avec tokens

### 🎯 Expérience Utilisateur Améliorée
- ✅ Connexion immédiate (pas d'attente)
- ✅ FirstLoginScreen guide l'utilisateur
- ✅ Mot de passe générique visible uniquement lors de la création
- ✅ Flux simplifié et intuitif

### 📊 Gestion Simplifiée
- ✅ Admin crée → User se connecte (2 étapes au lieu de 3)
- ✅ Pas de validation manuelle requise
- ✅ Moins de support utilisateur nécessaire

---

## Cas d'Usage Typiques

### 1️⃣ Nouvel Employé

```
Jour 1 - Matin
Admin : Crée le compte avec "Cabinet2024!"
Admin : Envoie l'email à l'employé avec ses identifiants

Jour 1 - Après-midi
Employé : Se connecte avec "Cabinet2024!"
Employé : Voit FirstLoginScreen
Employé : Définit son MDP personnel "Montr3@lJ@zz2024"
Employé : Configure sa phrase secrète
Employé : Accède au dashboard
Employé : Commence à travailler
```

### 2️⃣ Stagiaire Temporaire

```
Admin : Crée le compte avec "Stage2024!"
Admin : Communique les identifiants
Stagiaire : Se connecte immédiatement
Stagiaire : Change le mot de passe
Stagiaire : Travaille pendant X mois
Admin : Désactive le compte à la fin du stage
```

### 3️⃣ Collaborateur Externe

```
Admin : Crée le compte avec "Externe2024!"
Admin : Envoie les identifiants
Collaborateur : Se connecte depuis l'extérieur
Collaborateur : Change le mot de passe
Collaborateur : Accède aux dossiers assignés
```

---

## État de la Base de Données

### Table `profiles`

| Champ | Ancien Système | Nouveau Système |
|-------|----------------|-----------------|
| `admin_approved` | FALSE par défaut | TRUE par défaut |
| `must_change_password` | TRUE | TRUE (inchangé) |
| `has_custom_password` | FALSE | FALSE (inchangé) |
| `initial_password` | Hash du générique | Hash du générique |

### Fonction `internal_login()`

| Vérification | Ancien Système | Nouveau Système |
|--------------|----------------|-----------------|
| User trouvé | ✅ | ✅ |
| Admin approved | ✅ Vérifié | ❌ Ignoré |
| Mot de passe | ✅ | ✅ |
| Session créée | ✅ | ✅ |

---

## Support et Dépannage

### Si un utilisateur ne peut pas se connecter :

1. **Vérifier dans Supabase :**
   ```sql
   SELECT email, admin_approved, must_change_password, has_custom_password
   FROM profiles
   WHERE email = 'user@example.com';
   ```

2. **Vérifier les logs :**
   ```sql
   SELECT * FROM internal_login_logs
   WHERE user_identifier = 'user@example.com'
   ORDER BY attempt_time DESC
   LIMIT 5;
   ```

3. **Solutions courantes :**
   - Mot de passe incorrect → Vérifier le MDP générique
   - Compte non trouvé → Vérifier l'email/matricule
   - Erreur technique → Vérifier les logs Supabase

---

**Dernière mise à jour :** $(date)
