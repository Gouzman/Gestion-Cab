# 🔑 Configuration de la Clé de Service Supabase

## ⚡ Configuration Rapide (2 minutes)

### Étape 1 : Récupérer la Clé de Service

1. Ouvrez votre navigateur et allez sur [Supabase Dashboard](https://app.supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez le projet : **fhuzkubnxuetakpxkwlr**
4. Dans le menu latéral, cliquez sur **⚙️ Settings**
5. Puis cliquez sur **🔑 API**
6. Descendez jusqu'à la section **Project API keys**
7. Copiez la clé nommée **`service_role` (secret)**

**⚠️ ATTENTION :** Cette clé commence par `eyJhbGc...` et fait environ 200+ caractères.

---

### Étape 2 : Ajouter la Clé dans `.env.local`

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Remplacez la ligne :
   ```bash
   VITE_SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
   
   Par :
   ```bash
   VITE_SUPABASE_SERVICE_KEY=eyJhbGc... (votre vraie clé)
   ```

**Exemple de fichier `.env.local` complet :**
```bash
# Configuration Supabase
VITE_SUPABASE_URL=https://fhuzkubnxuetakpxkwlr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (nouvelle clé)

NODE_ENV=development
```

---

### Étape 3 : Redémarrer l'Application

```bash
# Arrêter le serveur de développement (Ctrl+C)

# Relancer l'application
npm run dev
```

---

## ✅ Vérification

Vous saurez que c'est bon si :

1. **L'application démarre sans erreur**
2. **Lors du premier upload, vous voyez dans la console :**
   ```
   📦 Installation automatique de la fonction SQL...
   ✅ Fonction RPC 'create_attachments_bucket' installée
   ✅ Bucket 'attachments' créé automatiquement
   ```

---

## 🔒 Sécurité

### ❌ NE JAMAIS :
- Commiter `.env.local` dans Git (déjà dans `.gitignore`)
- Partager cette clé publiquement
- L'utiliser côté client en production

### ✅ TOUJOURS :
- Garder cette clé privée
- Ne l'utiliser qu'en développement local ou côté serveur
- La régénérer si elle est compromise

---

## 🆘 En Cas de Problème

### Erreur : "VITE_SUPABASE_SERVICE_KEY non définie"

**Solution :**
1. Vérifiez que le fichier `.env.local` existe à la racine du projet
2. Vérifiez que la variable commence bien par `VITE_`
3. Relancez l'application (`npm run dev`)

### Erreur : "Impossible d'installer la fonction RPC"

**Solution :**
1. Vérifiez que la clé de service est correcte (elle doit être différente de l'anon key)
2. Vérifiez que vous avez les droits admin sur le projet Supabase
3. Si le problème persiste, créez le bucket manuellement dans Supabase Dashboard

---

## 📝 Rappel Rapide

```bash
# Localisation du fichier
/Users/gouzman/Documents/Gestion-Cab/.env.local

# Variable à ajouter
VITE_SUPABASE_SERVICE_KEY=votre_cle_service_role

# Commande pour redémarrer
npm run dev
```

---

**C'est tout ! Après cette configuration, le système créera automatiquement le bucket à la première utilisation.** 🎉
