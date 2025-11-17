# ⚡ Guide Rapide - Première Connexion Collaborateur

## 🎯 Pour les administrateurs

### Créer un nouveau collaborateur

1. Se connecter en tant qu'admin
2. Aller dans **"Collaborateurs"**
3. Cliquer sur **"Ajouter un collaborateur"**
4. Remplir les informations :
   - Email (obligatoire)
   - Nom
   - Rôle
   - Fonction
5. Cliquer sur **"Créer"**

✅ **Important :** Le collaborateur est créé avec `isFirstLogin = true` automatiquement.

### Communiquer l'email au collaborateur

Transmettez l'email au collaborateur par un canal sécurisé :
- En personne
- Par téléphone
- Par message sécurisé

**⚠️ Ne pas envoyer par email non sécurisé**

---

## 🎯 Pour les collaborateurs

### Première connexion

#### 1️⃣ Accéder à la plateforme

```
https://votre-domaine.com
```

#### 2️⃣ Entrer votre email

- Saisir l'email communiqué par votre administrateur
- Cliquer sur **"Continuer"**

#### 3️⃣ Créer votre mot de passe

Vous êtes redirigé vers une page de création de mot de passe :

- Votre email est affiché (non modifiable)
- **Nouveau mot de passe** : minimum 8 caractères
- **Confirmer le mot de passe** : saisir à nouveau

#### 4️⃣ Valider

- Cliquer sur **"Valider"**
- Vous êtes automatiquement connecté ! 🎉

---

### Connexions suivantes

Pour les connexions suivantes :

1. Entrer votre email
2. Entrer votre mot de passe
3. Cliquer sur **"Connexion"**

---

## 🔐 Mot de passe oublié ?

Si vous oubliez votre mot de passe :

1. Sur la page de connexion, entrer votre email
2. Entrer un mot de passe (n'importe lequel pour afficher le formulaire)
3. Cliquer sur **"Mot de passe oublié ?"**
4. Suivre les instructions reçues par email

---

## 📋 Exemples de scénarios

### Scénario 1 : Nouveau collaborateur

```
Admin → Crée jean.dupont@cabinet.com

Jean Dupont reçoit son email verbalement

Jean va sur la plateforme :
  1. Entre jean.dupont@cabinet.com
  2. Clique "Continuer"
  3. Voit la page "Créer votre mot de passe"
  4. Entre son mot de passe (2 fois)
  5. Clique "Valider"
  6. ✅ Connecté automatiquement !

Jean se déconnecte et revient le lendemain :
  1. Entre jean.dupont@cabinet.com
  2. Voit le champ "Mot de passe"
  3. Entre son mot de passe
  4. Clique "Connexion"
  5. ✅ Connecté normalement
```

### Scénario 2 : Email inexistant

```
Utilisateur entre marie.martin@cabinet.com
→ Email n'existe pas dans la base

Système affiche :
❌ "Compte introuvable. Contactez votre administrateur."

Solution : L'admin doit créer le compte
```

### Scénario 3 : Utilisateur existant

```
Utilisateur existant (créé avant cette fonctionnalité)
Entre son email
→ isFirstLogin = false (ou NULL)

Système affiche :
✅ Champ mot de passe directement

Connexion normale
```

---

## 🆘 Problèmes fréquents

### "Compte introuvable"

**Cause :** Votre email n'a pas été créé par l'administrateur.

**Solution :** Contactez votre administrateur pour qu'il crée votre compte.

---

### "User already registered"

**Cause :** Un compte existe déjà avec ce mot de passe.

**Solution :** 
- Essayez de vous connecter normalement
- Si vous avez oublié votre mot de passe, utilisez "Mot de passe oublié"

---

### Le mot de passe ne respecte pas les exigences

**Exigences :**
- Minimum 8 caractères
- Recommandé : 
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial (!@#$%^&*)

**Exemples de bons mots de passe :**
- `Cabinet2024!`
- `MonMotDePasse123!`
- `Avocat@Secure42`

---

### Les deux mots de passe ne correspondent pas

**Cause :** Le mot de passe et la confirmation sont différents.

**Solution :** Vérifiez que vous avez bien saisi le même mot de passe deux fois.

---

## ✅ Checklist administrateur

Avant de créer un collaborateur :

- [ ] Email professionnel valide
- [ ] Informations du collaborateur complètes
- [ ] Canal de communication sécurisé prêt
- [ ] Collaborateur informé de la procédure

Après création :

- [ ] Email communiqué au collaborateur
- [ ] Procédure de première connexion expliquée
- [ ] Vérification que le collaborateur peut se connecter

---

## 📊 Statistiques

| Étape | Temps estimé |
|-------|--------------|
| Création par admin | 30 secondes |
| Communication email | 1 minute |
| Première connexion | 1 minute |
| **TOTAL** | **~2-3 minutes** |

---

## 🔗 Documentation complète

Pour plus de détails techniques, voir :
- **`FLUX_PREMIERE_CONNEXION.md`** → Documentation technique complète

---

**Date :** 13 novembre 2025  
**Version :** 1.0  
**Status :** ✅ Opérationnel
