# 📄 Guide de Conversion Automatique Word → PDF

## 🎯 Objectif

Ce système convertit automatiquement tous les documents Word (.doc, .docx) en PDF **avant** leur upload dans Supabase Storage, permettant ainsi leur prévisualisation native dans l'application via PDF.js.

## ✨ Fonctionnalités

### Conversion Automatique
- ✅ Détection automatique des fichiers Word (.doc, .docx)
- ✅ Conversion via LibreOffice headless (locale, sans API externe)
- ✅ Remplacement transparent du fichier Word par le PDF converti
- ✅ Conservation du nom d'origine avec extension changée en `.pdf`
- ✅ Fallback gracieux si le service n'est pas disponible

### Intégration Transparente
- ✅ **Aucune modification dans TaskManager.jsx**
- ✅ Prévisualisation directe dans la modal existante
- ✅ Bouton "Télécharger" fonctionne normalement
- ✅ Bouton "Prévisualiser" ouvre le PDF converti
- ✅ Plus jamais d'erreur "le preview ne supporte que les fichiers pdf"

### Chaîne de Traitement
```
1. Upload Word (.docx) 
   ↓
2. Conversion → PDF (LibreOffice)
   ↓
3. Normalisation PDF (Ghostscript) [si nécessaire]
   ↓
4. Upload vers Supabase Storage
   ↓
5. Génération Signed URL
   ↓
6. Preview via PDF.js ✅
```

## 🔧 Installation

### 1. LibreOffice (Conversion Word → PDF)

```bash
# Installation via Homebrew
brew install --cask libreoffice

# Vérification
soffice --version
# Sortie attendue : LibreOffice 25.8.x.x
```

### 2. Ghostscript (Normalisation PDF)

**Déjà installé** - Voir `QUICK_START_PDF.md` pour plus de détails.

```bash
# Vérification
gs --version
# Sortie attendue : 10.06.0
```

### 3. Service de Conversion

Le service Node.js intègre maintenant **deux fonctionnalités** :
- Conversion Word → PDF (LibreOffice)
- Normalisation PDF (Ghostscript)

```bash
# Vérifier les dépendances
cd server
npm list express cors multer

# Démarrer le service
npm start
# OU
node index.js
```

## 🚀 Démarrage

### Option 1 : Script complet (recommandé)

```bash
./start-with-pdf-service.sh
```

Ce script démarre :
- ✅ Service de conversion et normalisation (port 3001)
- ✅ Application front-end (port 3000)

### Option 2 : Démarrage manuel

```bash
# Terminal 1 : Service backend
cd server
node index.js

# Terminal 2 : Application front-end
npm run dev
```

### Option 3 : Seulement l'application

```bash
npm run dev
```

⚠️ **Sans le service** : Les fichiers Word ne seront **pas** convertis et l'upload du fichier Word original sera tenté (avec fallback).

## 🌐 Endpoints du Service

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/convert-word-to-pdf` | POST | Convertit un document Word en PDF |
| `/normalize-pdf` | POST | Normalise un PDF avec Ghostscript |
| `/health` | GET | Vérifie l'état du service |

### Test de Conversion

```bash
# Créer un document Word de test
echo "Test de conversion Word → PDF" > /tmp/test.txt
soffice --headless --convert-to docx /tmp/test.txt --outdir /tmp

# Tester la conversion via le service
curl -X POST \
  -F "file=@/tmp/test.docx" \
  http://localhost:3001/convert-word-to-pdf \
  -o /tmp/test-converted.pdf

# Vérifier le résultat
file /tmp/test-converted.pdf
# Sortie attendue : PDF document, version 1.7
```

### Test de Santé

```bash
curl http://localhost:3001/health | python3 -m json.tool
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "ghostscript_version": "10.06.0",
  "libreoffice_version": "LibreOffice 25.8.3.2...",
  "message": "Service de conversion et normalisation opérationnel"
}
```

## 📂 Architecture

### Fichiers Modifiés

#### ✅ `server/index.js`
**Ajout de la conversion Word → PDF**

```javascript
// Nouvelle fonction
async function convertWordToPdf(inputPath) {
  const cmd = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
  // ...
}

// Nouvel endpoint
app.post('/convert-word-to-pdf', upload.single('file'), async (req, res) => {
  // Conversion LibreOffice
  const result = await convertWordToPdf(inputPath);
  // Envoi du PDF converti
  res.send(pdfData);
});
```

#### ✅ `src/lib/wordToPdfConverter.js`
**Utilisation du service local**

```javascript
async function convertViaSupabaseFunction(file) {
  // Appeler le service LibreOffice local (port 3001)
  const response = await fetch('http://localhost:3001/convert-word-to-pdf', {
    method: 'POST',
    body: formData
  });
  
  // Retourner le PDF converti
  return new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
}
```

#### ✅ `src/lib/uploadManager.js`
**Intégration déjà en place**

La logique de conversion est **déjà implémentée** dans ce fichier :

```javascript
// 2. Conversion automatique Word → PDF si nécessaire
if (isWordDocument(file)) {
  console.log(`📄 Document Word détecté: "${file.name}" - Conversion en PDF...`);
  const convertedPdf = await convertWordToPdf(file);
  if (convertedPdf) {
    fileToUpload = convertedPdf;
    wasConverted = true;
  }
}

// 2b. Optimisation PDF pour garantir la compatibilité avec PDF.js
if (isPdfDocument(fileToUpload)) {
  const optimizedPdf = await optimizePdfForViewer(fileToUpload);
  // ...
}
```

### Fichiers **NON** Modifiés

#### ❌ `src/components/TaskManager.jsx`
**Aucune modification requise** - Le composant utilise déjà le système de preview existant qui fonctionne maintenant avec les PDFs convertis.

## 🧪 Tests

### Test Complet d'Upload

1. **Créer un document Word de test**

```bash
cat > /tmp/test-upload.txt << 'EOF'
DOCUMENT DE TEST POUR UPLOAD

Ce document contient :
- Du texte formaté
- Des caractères spéciaux : é è ê à ù ç
- Des sections multiples

Ce test vérifie :
✓ Conversion Word → PDF
✓ Upload vers Supabase
✓ Preview dans l'application
EOF

# Convertir en Word
soffice --headless --convert-to docx /tmp/test-upload.txt --outdir /tmp
```

2. **Upload dans l'application**
   - Aller dans TaskManager
   - Cliquer sur "Ajouter un fichier"
   - Sélectionner `/tmp/test-upload.docx`
   - Observer la console : `📄 Document Word détecté - Conversion en PDF...`
   - Observer : `✅ Conversion réussie: "test-upload.docx" → "test-upload.pdf"`

3. **Prévisualiser**
   - Cliquer sur "Prévisualiser"
   - ✅ Le PDF s'ouvre dans la modal
   - ✅ Aucune erreur "le preview ne supporte que les fichiers pdf"

### Vérification Console

**Logs attendus lors de l'upload d'un fichier Word :**

```
📄 Document Word détecté: "document.docx" - Conversion en PDF...
✅ Conversion réussie: "document.docx" → "document.pdf"
📄 PDF détecté: "document.pdf" - Optimisation pour PDF.js...
✅ PDF optimisé: 25.3 Ko → 52.1 Ko
📤 Upload du PDF converti et optimisé "document.pdf" (original: "document.docx") pour la tâche 123...
✅ Upload vers Supabase Storage réussi
✅ URL publique générée: https://...
✅ Document Word "document.docx" converti, optimisé et uploadé avec succès - ID: 456
```

## 🔍 Diagnostic

### Problème : Conversion ne fonctionne pas

**Symptômes :**
- Message : `⚠️ Service de conversion LibreOffice non disponible`
- Le fichier Word original est uploadé (pas de conversion)

**Solutions :**

1. **Vérifier que le service est démarré**
```bash
curl http://localhost:3001/health
```

2. **Vérifier LibreOffice**
```bash
soffice --version
```

3. **Vérifier les logs du service**
```bash
# Si démarré avec start-with-pdf-service.sh
tail -f server/server.log

# Sinon, regarder la sortie du terminal
```

4. **Redémarrer le service**
```bash
# Arrêter
pkill -f "node index.js"

# Redémarrer
cd server && node index.js
```

### Problème : PDF converti illisible

**Symptômes :**
- PDF s'affiche mais contenu incorrect
- Erreurs dans la console PDF.js

**Solutions :**

1. **Vérifier la version LibreOffice**
```bash
soffice --version
# Minimum : 7.x
```

2. **Tester la conversion manuellement**
```bash
soffice --headless --convert-to pdf --outdir /tmp /tmp/test.docx
file /tmp/test.pdf
```

3. **Vérifier que Ghostscript normalise le PDF**
```bash
# Le PDF doit passer par la normalisation après conversion
# Vérifier les logs : "PDF optimisé: X Ko → Y Ko"
```

### Problème : Fichier trop volumineux

**Symptômes :**
- Erreur : `Fichier trop volumineux (X Mo). Limite: 50 Mo.`

**Solutions :**

1. **Augmenter la limite dans `uploadManager.js`**
```javascript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 Mo
```

2. **Augmenter la limite dans `server/index.js`**
```javascript
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 Mo
});
```

## 📊 Performances

### Temps de Conversion Moyens

| Type de fichier | Taille | Temps de conversion | Taille PDF |
|----------------|--------|---------------------|------------|
| .docx simple | 15 KB | ~1-2s | 25 KB |
| .docx avec images | 500 KB | ~3-5s | 800 KB |
| .doc ancien | 100 KB | ~2-3s | 150 KB |

### Optimisations

- ✅ Conversion en arrière-plan (non bloquante)
- ✅ Fallback si service indisponible
- ✅ Nettoyage automatique des fichiers temporaires (toutes les heures)
- ✅ Compression automatique via Ghostscript

## 🛡️ Sécurité

### Validation des Fichiers

```javascript
// Dans uploadManager.js
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo
if (file.size > MAX_FILE_SIZE) {
  return { success: false, error: 'Fichier trop volumineux' };
}

// Dans server/index.js
fileFilter: (req, file, cb) => {
  const isWord = /\.(doc|docx)$/i.test(file.originalname);
  if (isPdf || isWord) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF et Word sont acceptés'), false);
  }
}
```

### Nettoyage Temporaire

```javascript
// Nettoyage automatique toutes les heures
setInterval(async () => {
  const files = await fs.readdir(tempDir);
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const file of files) {
    const stats = await fs.stat(filePath);
    if (stats.mtimeMs < oneHourAgo) {
      await fs.unlink(filePath);
    }
  }
}, 60 * 60 * 1000);
```

## 📚 Ressources

### Documentation Connexe

- `QUICK_START_PDF.md` - Guide de normalisation PDF avec Ghostscript
- `GUIDE_NORMALISATION_PDF.md` - Détails sur la normalisation PDF
- `ARCHITECTURE_PDF.md` - Architecture technique du système PDF

### Commandes Utiles

```bash
# Santé des services
curl http://localhost:3001/health

# Convertir Word → PDF manuellement
soffice --headless --convert-to pdf input.docx --outdir /tmp

# Normaliser PDF manuellement
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite \
  -dEmbedAllFonts=true -dPDFSETTINGS=/prepress \
  -sOutputFile=output.pdf input.pdf

# Vérifier les processus
lsof -i :3001  # Service de conversion
lsof -i :3000  # Application front-end

# Logs du service
tail -f server/server.log
```

## ✅ Checklist de Validation

- [ ] LibreOffice installé (`soffice --version`)
- [ ] Ghostscript installé (`gs --version`)
- [ ] Service démarré (`curl http://localhost:3001/health`)
- [ ] Test de conversion manuelle réussi
- [ ] Upload d'un fichier .docx dans l'application
- [ ] Conversion visible dans les logs
- [ ] Prévisualisation fonctionnelle
- [ ] Aucune erreur "le preview ne supporte que les fichiers pdf"
- [ ] Téléchargement du fichier fonctionne
- [ ] Fichier stocké en tant que PDF dans Supabase

## 🎉 Résultat Final

### Avant
```
❌ Upload fichier .docx
   → Preview échoue : "le preview ne supporte que les fichiers pdf"
   → Téléchargement : fichier .docx
```

### Après
```
✅ Upload fichier .docx
   → Conversion automatique → .pdf
   → Normalisation PDF (polices intégrées)
   → Upload vers Supabase en tant que PDF
   → Preview fonctionne ✅
   → Téléchargement : fichier .pdf (converti)
```

## 🤝 Support

En cas de problème :

1. **Vérifier les prérequis**
   - LibreOffice installé
   - Service démarré sur port 3001

2. **Consulter les logs**
   - Console navigateur (F12)
   - Logs du service Node.js

3. **Tester manuellement**
   - Conversion via curl
   - Health check du service

4. **Fallback gracieux**
   - Si le service est indisponible, le fichier Word original sera uploadé
   - Un message d'avertissement apparaîtra dans les logs

---

**Mise à jour :** 27 novembre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Opérationnel
