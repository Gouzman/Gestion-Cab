# 📧 Guide d'Activation de l'Envoi d'Emails

## 🔍 État Actuel : MODE DEBUG

**Les emails ne sont PAS envoyés réellement.**

Ils sont affichés dans la **console du navigateur** (F12 → Console).

---

## 📋 Comment Voir les Mots de Passe en Mode DEBUG

### Méthode 1 : Via la Console du Navigateur

1. **Ouvrir les DevTools :**
   ```
   Windows/Linux : F12 ou Ctrl + Shift + I
   Mac : Cmd + Option + I
   ```

2. **Aller dans l'onglet "Console"**

3. **Créer un utilisateur :**
   - Aller dans "Collaborateurs"
   - Cliquer sur "Ajouter un collaborateur"
   - Remplir le formulaire
   - Cliquer sur "Ajouter"

4. **Voir le mot de passe :**
   - Dans la console, chercher `=== EMAIL À ENVOYER ===`
   - Le mot de passe sera visible en clair

**Exemple dans la console :**
```
=== EMAIL À ENVOYER ===
À: jean.dupont@exemple.com
Sujet: Bienvenue sur Gestion de Cabinet - Vos identifiants de connexion
Message:
Bonjour Jean Dupont,

Votre compte a été créé avec succès...

🔑 Mot de passe : aB3$xK9mP@wZ

...
=====================
```

### Méthode 2 : Via le Toast (Notification)

Si l'email n'est pas envoyé, le mot de passe s'affiche dans la notification :

```
✅ Collaborateur ajouté
⚠️ Email non envoyé - Mot de passe : aB3$xK9mP@wZ
```

---

## 🚀 Activer l'Envoi Réel d'Emails

### Option 1 : Resend (Recommandé - Gratuit)

**Pourquoi Resend ?**
- ✅ 100 emails/jour gratuits
- ✅ API simple
- ✅ Pas de carte bancaire requise
- ✅ Configuration rapide (5 minutes)

#### Étape 1 : Créer un Compte Resend

1. Aller sur https://resend.com
2. Cliquer sur "Sign Up"
3. Créer un compte (gratuit)
4. Vérifier votre email

#### Étape 2 : Obtenir une API Key

1. Dans le dashboard Resend, aller dans "API Keys"
2. Cliquer sur "Create API Key"
3. Nom : `Gestion-Cabinet`
4. Permission : **Full Access**
5. Copier la clé : `re_xxxxxxxxxxxxxxxxxx`

#### Étape 3 : Configurer Votre Domaine (Optionnel)

**Option A : Utiliser le domaine de test (pour tester)**
- Resend fournit un domaine de test : `onboarding@resend.dev`
- Limité mais fonctionne immédiatement

**Option B : Configurer votre domaine (pour la production)**
1. Dans Resend : Domains → Add Domain
2. Entrer votre domaine : `votre-domaine.com`
3. Ajouter les enregistrements DNS (fournis par Resend)
4. Vérifier le domaine

#### Étape 4 : Ajouter la Clé API

Créer ou modifier le fichier `.env.local` à la racine du projet :

```bash
# .env.local

# Supabase (déjà existant)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Resend API Key (NOUVEAU)
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
VITE_RESEND_FROM_EMAIL=noreply@votre-domaine.com
```

**⚠️ Si vous n'avez pas de domaine, utilisez :**
```bash
VITE_RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### Étape 5 : Installer Resend

```bash
npm install resend
```

#### Étape 6 : Activer le Code d'Envoi

Ouvrir `src/lib/emailService.js` et **décommenter** le code entre `/* ... */` (lignes 50-82).

**Remplacer :**
```javascript
/*
// Envoi réel via Resend
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
...
*/
```

**Par :**
```javascript
// Envoi réel via Resend
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

if (RESEND_API_KEY) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Gestion de Cabinet <${FROM_EMAIL}>`,
        to: email,
        subject: subject,
        text: message,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erreur Resend:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email envoyé avec succès via Resend');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi via Resend:', error);
    return { success: false, error: error.message };
  }
}
```

#### Étape 7 : Redémarrer l'Application

```bash
# Arrêter le serveur (Ctrl + C)
# Relancer
npm run dev
```

#### Étape 8 : Tester

1. Créer un utilisateur
2. Vérifier dans la console : `✅ Email envoyé avec succès via Resend`
3. Vérifier votre boîte email

---

### Option 2 : SendGrid (Alternative)

**Avantages :** 100 emails/jour gratuits, très fiable

**Étapes :**

1. Créer un compte sur https://sendgrid.com
2. Obtenir une API Key
3. Installer : `npm install @sendgrid/mail`
4. Ajouter dans `.env.local` :
   ```bash
   VITE_SENDGRID_API_KEY=SG.xxxxx
   VITE_SENDGRID_FROM_EMAIL=noreply@votre-domaine.com
   ```
5. Modifier `src/lib/emailService.js` :

```javascript
import sgMail from '@sendgrid/mail';

export async function sendWelcomeEmail(email, password, name) {
  const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
  
  if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: import.meta.env.VITE_SENDGRID_FROM_EMAIL,
      subject: 'Bienvenue sur Gestion de Cabinet',
      text: message,
    };
    
    try {
      await sgMail.send(msg);
      console.log('✅ Email envoyé via SendGrid');
      return { success: true };
    } catch (error) {
      console.error('Erreur SendGrid:', error);
      return { success: false, error: error.message };
    }
  }
}
```

---

### Option 3 : Supabase Edge Function (Avancé)

**Avantages :** Intégré à Supabase, sécurisé

**Inconvénients :** Plus complexe à configurer

Voir la documentation : https://supabase.com/docs/guides/functions

---

## ✅ Vérification de l'Envoi

### Dans la Console du Navigateur

**Mode DEBUG (avant activation) :**
```
=== EMAIL À ENVOYER ===
...
```

**Mode PRODUCTION (après activation) :**
```
✅ Email envoyé avec succès via Resend
```

### Dans le Dashboard Resend

1. Aller sur https://resend.com/emails
2. Voir la liste des emails envoyés
3. Vérifier le statut : "Delivered" ✅

---

## 🧪 Test Complet

### Test 1 : Création Manuelle

1. Aller dans "Collaborateurs"
2. Ajouter un utilisateur avec votre email personnel
3. Vérifier votre boîte email
4. Tester la connexion avec le mot de passe reçu

### Test 2 : Import CSV

1. Créer un fichier `test.csv` :
   ```csv
   name,email,role,title,function
   Jean Dupont,votre.email@gmail.com,user,Avocat,Collaborateur
   ```
2. Importer le fichier
3. Vérifier l'email reçu

---

## 🐛 Dépannage

### Problème : "VITE_RESEND_API_KEY is not defined"

**Solution :**
1. Vérifier que `.env.local` existe
2. Vérifier la syntaxe : `VITE_RESEND_API_KEY=re_xxxxx` (pas d'espaces)
3. Redémarrer le serveur : `npm run dev`

### Problème : "Domain not verified"

**Solution :**
1. Utiliser `onboarding@resend.dev` pour tester
2. Ou configurer votre domaine dans Resend → Domains

### Problème : L'email arrive en SPAM

**Solutions :**
1. Configurer SPF, DKIM, DMARC (fournis par Resend)
2. Utiliser un domaine vérifié
3. Ajouter l'expéditeur aux contacts

### Problème : L'email n'arrive pas

**Vérifications :**
1. Console du navigateur : erreurs ?
2. Dashboard Resend : email envoyé ?
3. Boîte SPAM vérifiée ?
4. Email correct dans Resend ?

---

## 💰 Limites Gratuites

### Resend
- ✅ 100 emails/jour
- ✅ 1 domaine vérifié
- ✅ API complète

### SendGrid
- ✅ 100 emails/jour
- ✅ Support 24/7
- ✅ Analytiques

**Pour augmenter :** Plans payants à partir de 10-15$/mois

---

## 🎯 Résumé

### Mode DEBUG (Actuel)
```
✅ Mot de passe visible dans la console
✅ Pas besoin de configuration
❌ Emails non envoyés
```

### Mode PRODUCTION (Après activation)
```
✅ Emails envoyés réellement
✅ Professionnel
✅ Traçabilité
⚙️ Nécessite configuration (5 min)
```

---

## 📞 Support

**Documentation Resend :** https://resend.com/docs  
**Documentation SendGrid :** https://docs.sendgrid.com  
**Support Supabase :** https://supabase.com/docs

---

**Conseil :** Commencez avec Resend (gratuit, simple) pour tester, puis passez à un plan payant si vous dépassez 100 emails/jour.

