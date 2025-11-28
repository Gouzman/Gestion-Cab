# 📋 Index de la Documentation - Conversion Word → PDF

## 🚀 Démarrage Rapide

1. **[QUICK_START_WORD_PDF.md](QUICK_START_WORD_PDF.md)**  
   Guide de démarrage en 30 secondes

2. **[GUIDE_CONVERSION_WORD_PDF.md](GUIDE_CONVERSION_WORD_PDF.md)**  
   Documentation complète avec tous les détails techniques

## 📚 Documentation Connexe

### Système PDF Existant

- **[QUICK_START_PDF.md](QUICK_START_PDF.md)**  
  Démarrage rapide - Normalisation PDF (Ghostscript)

- **[GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md)**  
  Guide complet de normalisation PDF

- **[ARCHITECTURE_PDF.md](ARCHITECTURE_PDF.md)**  
  Architecture technique du système PDF

### Corrections et Diagnostics

- **[CORRECTIONS_APPLIQUEES.md](CORRECTIONS_APPLIQUEES.md)**  
  Historique des corrections (canvas, auth, bucket)

- **[QUICK_FIX_RESUME.md](QUICK_FIX_RESUME.md)**  
  Résumé des corrections récentes

## 🔧 Fichiers Techniques

### Backend (Service de Conversion)

- **`server/index.js`**  
  Service Node.js avec endpoints :
  - `/convert-word-to-pdf` - Conversion Word → PDF (LibreOffice)
  - `/normalize-pdf` - Normalisation PDF (Ghostscript)
  - `/health` - Status des services

- **`server/package.json`**  
  Dépendances : express, cors, multer

### Frontend (Intégration)

- **`src/lib/wordToPdfConverter.js`**  
  Fonctions de conversion côté client
  - `isWordDocument()` - Détection fichiers Word
  - `convertWordToPdf()` - Appel au service local
  - Fallback client-side (mammoth.js + jsPDF)

- **`src/lib/uploadManager.js`**  
  Orchestration de l'upload avec conversion automatique
  - Détection Word → Conversion PDF
  - Normalisation PDF automatique
  - Upload vers Supabase Storage

- **`src/lib/pdfOptimizer.js`**  
  Normalisation et optimisation PDF
  - Intégration des polices (Ghostscript)
  - Compatibilité PDF.js garantie

### Non Modifiés

- **`src/components/TaskManager.jsx`**  
  ✅ Aucune modification requise
  - Preview fonctionne automatiquement avec les PDFs convertis
  - Boutons Télécharger/Prévisualiser inchangés

## 🎯 Workflow Complet

```
┌─────────────────────────────────────────────────┐
│ 1. Upload Fichier (.docx)                      │
│    ↓ uploadManager.js                          │
├─────────────────────────────────────────────────┤
│ 2. Détection Type                              │
│    isWordDocument(file) → true                 │
│    ↓                                           │
├─────────────────────────────────────────────────┤
│ 3. Conversion Word → PDF                       │
│    wordToPdfConverter.js                       │
│    → POST http://localhost:3001/convert...    │
│    → LibreOffice headless                     │
│    ↓                                           │
├─────────────────────────────────────────────────┤
│ 4. Normalisation PDF                           │
│    pdfOptimizer.js                            │
│    → POST http://localhost:3001/normalize...  │
│    → Ghostscript (intégration polices)        │
│    ↓                                           │
├─────────────────────────────────────────────────┤
│ 5. Upload Supabase Storage                    │
│    uploadManager.js                           │
│    → bucket 'attachments'                     │
│    → Métadonnées dans tasks_files             │
│    ↓                                           │
├─────────────────────────────────────────────────┤
│ 6. Génération URL Signée                      │
│    createPreviewUrl()                         │
│    → Supabase Storage API                    │
│    ↓                                           │
├─────────────────────────────────────────────────┤
│ 7. Preview PDF                                │
│    TaskManager.jsx                            │
│    → PdfViewer component                      │
│    → PDF.js rendering                         │
│    ✅ Succès                                   │
└─────────────────────────────────────────────────┘
```

## 🔍 Guide de Navigation

### Je veux...

#### Démarrer rapidement
→ `QUICK_START_WORD_PDF.md`

#### Comprendre l'architecture
→ `GUIDE_CONVERSION_WORD_PDF.md` (section Architecture)

#### Diagnostiquer un problème
→ `GUIDE_CONVERSION_WORD_PDF.md` (section Diagnostic)

#### Tester la conversion
→ `GUIDE_CONVERSION_WORD_PDF.md` (section Tests)

#### Modifier le code
→ Voir "Fichiers Techniques" ci-dessus

#### Comprendre le système PDF existant
→ `ARCHITECTURE_PDF.md`

## 📊 Statut des Composants

| Composant | Statut | Version | Notes |
|-----------|--------|---------|-------|
| LibreOffice | ✅ Installé | 25.8.3.2 | Conversion Word → PDF |
| Ghostscript | ✅ Installé | 10.06.0 | Normalisation PDF |
| Service Node.js | ✅ Opérationnel | 1.0 | Port 3001 |
| Frontend React | ✅ Opérationnel | - | Port 3000 |
| Supabase Storage | ✅ Configuré | - | Bucket 'attachments' |
| PDF.js | ✅ Opérationnel | 3.11.174 | Rendering PDF |

## 🛠️ Commandes Rapides

```bash
# Démarrer tout
./start-with-pdf-service.sh

# Santé des services
curl http://localhost:3001/health

# Tester conversion Word
curl -X POST -F "file=@test.docx" \
  http://localhost:3001/convert-word-to-pdf \
  -o result.pdf

# Tester normalisation PDF
curl -X POST -F "file=@test.pdf" \
  http://localhost:3001/normalize-pdf \
  -o normalized.pdf

# Arrêter les services
pkill -f "node index.js"
```

## 📧 Support

1. **Consulter la documentation**  
   Commencer par `GUIDE_CONVERSION_WORD_PDF.md`

2. **Vérifier les logs**  
   - Console navigateur (F12)
   - Logs service : `tail -f server/server.log`

3. **Tester manuellement**  
   Voir section "Tests" dans le guide

## 📝 Changelog

### 2025-11-27 - v1.0.0
- ✅ LibreOffice installé (25.8.3.2)
- ✅ Service de conversion Word → PDF créé
- ✅ Intégration dans uploadManager.js
- ✅ Tests de conversion réussis
- ✅ Documentation complète créée
- ✅ Aucune modification dans TaskManager.jsx

---

**Mise à jour :** 27 novembre 2025  
**Maintenu par :** Système de gestion de cabinet
