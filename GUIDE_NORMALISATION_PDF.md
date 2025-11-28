# 📄 Système de Normalisation PDF avec Ghostscript

## 🎯 Objectif

Ce système automatique normalise tous les PDF uploadés pour garantir leur compatibilité parfaite avec PDF.js, en éliminant les erreurs "TT undefined" causées par des polices non intégrées.

## ✨ Fonctionnalités

✅ **Intégration automatique des polices** : Toutes les polices sont intégrées dans le PDF  
✅ **Normalisation transparente** : Aucun changement dans l'interface utilisateur  
✅ **Compatible PDF.js** : Plus d'erreurs de polices manquantes  
✅ **Non-bloquant** : Si le service est indisponible, le PDF original est utilisé  
✅ **Support multi-formats** : Word, images et PDF  

## 🚀 Installation et Démarrage

### Méthode 1 : Script automatique (recommandé)

```bash
./start-with-pdf-service.sh
```

Ce script :
- Vérifie que Ghostscript est installé
- Démarre le service de normalisation PDF (port 3001)
- Démarre l'application front-end (port 3000)
- Affiche les logs en temps réel

### Méthode 2 : Démarrage manuel

**Terminal 1 - Service de normalisation PDF :**
```bash
cd server
npm install  # Première fois seulement
npm start
```

**Terminal 2 - Application front-end :**
```bash
npm run dev
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│  Application React/Vite (port 3000)              │
│  - TaskManager.jsx (interface utilisateur)       │
│  - uploadManager.js (gestion des uploads)        │
│  - pdfOptimizer.js (optimisation PDF)            │
└────────────────┬─────────────────────────────────┘
                 │
                 │ Upload PDF
                 ▼
┌──────────────────────────────────────────────────┐
│  Service Node.js (port 3001)                     │
│  - Reçoit le PDF via /normalize-pdf              │
│  - Appelle Ghostscript pour normalisation        │
│  - Retourne le PDF normalisé                     │
└────────────────┬─────────────────────────────────┘
                 │
                 │ Commande gs
                 ▼
┌──────────────────────────────────────────────────┐
│  Ghostscript                                     │
│  - Intègre toutes les polices                    │
│  - Normalise en PDF 1.4                          │
│  - Optimise pour prepress                        │
└──────────────────────────────────────────────────┘
                 │
                 │ PDF normalisé
                 ▼
┌──────────────────────────────────────────────────┐
│  Supabase Storage                                │
│  - Bucket "attachments"                          │
│  - PDF prêt pour PDF.js                          │
└──────────────────────────────────────────────────┘
```

## 🔧 Processus de Normalisation

1. **Upload** : L'utilisateur upload un PDF via l'interface
2. **Détection** : `pdfOptimizer.js` détecte qu'il s'agit d'un PDF
3. **Envoi au service** : Le PDF est envoyé au service de normalisation (port 3001)
4. **Ghostscript** : Le service exécute la commande Ghostscript avec les paramètres optimaux
5. **Retour** : Le PDF normalisé est renvoyé au client
6. **Upload Supabase** : Le PDF normalisé est uploadé dans le bucket "attachments"
7. **Affichage** : Le PDF s'affiche parfaitement dans le visualiseur PDF.js

## 🛠️ Commande Ghostscript Utilisée

```bash
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite \
   -dEmbedAllFonts=true \
   -dSubsetFonts=false \
   -dPDFSETTINGS=/prepress \
   -dCompatibilityLevel=1.4 \
   -sOutputFile="output.pdf" "input.pdf"
```

**Paramètres :**
- `-dEmbedAllFonts=true` : Intègre toutes les polices dans le PDF
- `-dSubsetFonts=false` : Utilise les polices complètes (pas de sous-ensembles)
- `-dPDFSETTINGS=/prepress` : Qualité maximale pour impression professionnelle
- `-dCompatibilityLevel=1.4` : Version PDF 1.4 (excellente compatibilité avec PDF.js)

## 📝 Code Modifié

### Fichiers créés
- `server/index.js` : Service Node.js de normalisation
- `server/package.json` : Dépendances du service
- `start-with-pdf-service.sh` : Script de démarrage automatique

### Fichiers modifiés
- `src/lib/pdfOptimizer.js` : Modification de `optimizeViaSupabaseFunction()` pour utiliser le service local

### Fichiers non modifiés (comme demandé)
- `src/components/TaskManager.jsx` : Aucune modification
- `src/lib/uploadManager.js` : Utilise déjà `pdfOptimizer.js`, aucun changement nécessaire
- Tous les autres composants UI : Intacts

## 🧪 Test du Système

### 1. Vérifier que le service fonctionne

```bash
curl http://localhost:3001/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "ghostscript_version": "10.06.0",
  "message": "Service de normalisation PDF opérationnel"
}
```

### 2. Tester la normalisation

```bash
curl -X POST -F "file=@test.pdf" http://localhost:3001/normalize-pdf --output test_normalized.pdf
```

### 3. Test dans l'application

1. Démarrer l'application : `./start-with-pdf-service.sh`
2. Ouvrir http://localhost:3000
3. Créer une nouvelle tâche
4. Uploader un PDF avec des polices custom
5. Ouvrir le PDF dans le visualiseur
6. ✅ Le PDF doit s'afficher sans erreur "TT undefined"

## 📊 Logs et Diagnostics

### Service de normalisation PDF

Les logs affichent :
- 📄 Réception des PDF
- ✅ Succès de normalisation
- ❌ Erreurs éventuelles
- 🗑️ Nettoyage des fichiers temporaires

### Application front-end

Dans la console du navigateur :
```
📄 Optimisation PDF: "document.pdf" pour PDF.js...
✅ PDF normalisé avec Ghostscript: 245678 bytes → 234567 bytes
📤 Upload du PDF optimisé "document.pdf" (228.87 Ko) pour la tâche 123...
✅ Upload vers Supabase Storage réussi
```

## 🚨 Résolution de Problèmes

### Le service ne démarre pas

**Erreur :** `Ghostscript non trouvé`
```bash
brew install ghostscript
```

**Erreur :** `Port 3001 déjà utilisé`
```bash
# Trouver le processus
lsof -i :3001

# Tuer le processus
kill -9 <PID>
```

### Le PDF n'est pas normalisé

**Vérifier :**
1. Le service est-il démarré ? → `curl http://localhost:3001/health`
2. Y a-t-il des erreurs dans les logs du service ?
3. Le PDF original est-il valide ?

**Fallback automatique :**
Si le service est indisponible, le système utilise automatiquement le PDF original sans bloquer l'upload.

### Erreur "CORS" dans le navigateur

Le service est configuré pour accepter les requêtes depuis `localhost:3000`. Si vous utilisez un autre port, modifiez `server/index.js` :

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:VOTRE_PORT'],
  // ...
}));
```

## 🔒 Sécurité

- Les fichiers temporaires sont automatiquement supprimés après traitement
- Nettoyage périodique toutes les heures
- Limite de taille : 50 MB par fichier
- Validation des types MIME

## 🎉 Résultat Final

- ✅ **Aucun changement UI** : L'interface reste identique
- ✅ **Aucun code supprimé** : Tout le code existant est préservé
- ✅ **PDF parfaits** : Plus d'erreurs "TT undefined"
- ✅ **Automatique** : La normalisation est transparente
- ✅ **Robuste** : Fallback sur le PDF original si le service est indisponible

## 📚 Documentation Additionnelle

- **Ghostscript** : https://www.ghostscript.com/documentation.html
- **PDF.js** : https://mozilla.github.io/pdf.js/
- **Express.js** : https://expressjs.com/
- **Multer** : https://github.com/expressjs/multer

## 💡 Déploiement en Production

Pour la production, vous pouvez :

1. **Option 1 : Supabase Edge Function**
   - Déployer le code de normalisation comme Edge Function
   - Avantage : Pas besoin de serveur séparé
   - Limitation : Ghostscript doit être inclus dans le runtime

2. **Option 2 : Service Docker**
   - Créer une image Docker avec Node.js + Ghostscript
   - Déployer sur un service comme Railway, Render, ou Fly.io
   - Modifier l'URL dans `pdfOptimizer.js`

3. **Option 3 : API Gateway + Lambda**
   - Créer une fonction AWS Lambda avec Ghostscript layer
   - Utiliser API Gateway comme endpoint
   - Très scalable mais plus complexe à configurer

## 📞 Support

En cas de problème, vérifiez :
1. Les logs du service de normalisation
2. La console du navigateur
3. Les logs de Supabase Storage
4. La version de Ghostscript : `gs --version`
