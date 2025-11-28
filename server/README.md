# Service de Normalisation PDF avec Ghostscript

Ce service Node.js utilise Ghostscript pour normaliser les PDF et les rendre parfaitement compatibles avec PDF.js.

## 🎯 Fonctionnalités

- **Intégration complète des polices** : Toutes les polices sont intégrées dans le PDF
- **Normalisation PDF** : Conversion en PDF 1.4 compatible avec tous les lecteurs
- **Optimisation pour PDF.js** : Élimine les problèmes de polices manquantes (TT undefined)

## 🚀 Installation

```bash
cd server
npm install
```

## ▶️ Démarrage

```bash
npm start
```

Le service démarre sur le port **3001**.

## 🏥 Health Check

Vérifiez que le service fonctionne :

```bash
curl http://localhost:3001/health
```

## 📡 API

### POST /normalize-pdf

Normalise un fichier PDF.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (fichier PDF)

**Response:**
- Content-Type: `application/pdf`
- Body: PDF normalisé

**Exemple avec curl:**

```bash
curl -X POST -F "file=@document.pdf" http://localhost:3001/normalize-pdf --output document_normalized.pdf
```

## 🔧 Configuration

Le service utilise Ghostscript avec les paramètres suivants :
- `-dEmbedAllFonts=true` : Intègre toutes les polices
- `-dSubsetFonts=false` : Polices complètes (pas de sous-ensembles)
- `-dPDFSETTINGS=/prepress` : Qualité maximale
- `-dCompatibilityLevel=1.4` : Compatible avec PDF.js

## 🗑️ Nettoyage

Les fichiers temporaires sont automatiquement supprimés après 1 heure.

## ⚠️ Prérequis

Ghostscript doit être installé :
- **macOS**: `brew install ghostscript`
- **Linux**: `sudo apt install ghostscript -y`
- **Windows**: Télécharger depuis [ghostscript.com](https://www.ghostscript.com/download/gsdnld.html)
