# Plan d'Unification de la Prévisualisation des Documents
## Projet Gestion-Cab

**Date d'analyse :** 28 novembre 2025  
**Objectif :** Unifier la gestion de la prévisualisation et du téléchargement des documents dans toute l'application

---

## 📋 Table des matières

1. [État des lieux](#état-des-lieux)
2. [Système de référence (TaskManager.jsx)](#système-de-référence)
3. [Zones concernées par l'unification](#zones-concernées)
4. [Architecture proposée](#architecture-proposée)
5. [Plan d'implémentation](#plan-dimplémentation)
6. [Contraintes et prérequis](#contraintes-et-prérequis)

---

## 🔍 État des lieux

### Composants avec prévisualisation/téléchargement de fichiers

L'analyse du projet révèle **3 composants principaux** gérant la prévisualisation et le téléchargement de fichiers :

| Composant | Fichier | Méthode actuelle | État |
|-----------|---------|------------------|------|
| **TaskManager** | `src/components/TaskManager.jsx` | ✅ URL signée + PdfViewer + conversion Word | **RÉFÉRENCE** |
| **TaskCard** | `src/components/TaskCard.jsx` | ⚠️ `download()` + `getPublicUrl()` + `window.open()` | **À UNIFIER** |
| **DocumentManager** | `src/components/DocumentManager.jsx` | ⚠️ `downloadFileWithCors()` + `window.open()` | **À UNIFIER** |

### Autres composants d'affichage (sans prévisualisation interactive)

| Composant | Fichier | Type | Concerné |
|-----------|---------|------|----------|
| BillingManager | `src/components/BillingManager.jsx` | Facturation | ❌ Non (pas de fichiers joints) |
| CaseManager | `src/components/CaseManager.jsx` | Dossiers juridiques | ❌ Non (métadonnées uniquement) |
| AgendaPage | `src/components/AgendaPage.jsx` | Calendrier | ❌ Non (événements) |
| Reports | `src/components/Reports.jsx` | Rapports PDF générés | ⚠️ Potentiel (génération PDF) |

### Composants d'impression (Print)

Ces composants génèrent des vues imprimables mais **ne gèrent pas de fichiers uploadés** :

- `CasePrintPage.jsx` - Vue d'impression des dossiers
- `InvoicePrintView.jsx` - Vue d'impression de facture
- `BillingPrintPage.jsx` - Vue d'impression de facturation
- `ClientsPrintPage.jsx` - Vue d'impression des clients

**Conclusion :** Ces composants ne sont **pas concernés** par l'unification.

---

## ✅ Système de référence

### TaskManager.jsx - Méthode à adopter partout

Le composant `TaskManager` implémente **la solution complète et robuste** :

#### 1. Génération d'URL signée pour prévisualisation

```javascript
const createPreviewUrl = async (file) => {
  // Extraction du bucket et du chemin
  let bucket = 'attachments';
  let filePath = '';
  
  if (file.file_url.startsWith('http')) {
    // Extraire depuis URL complète
    const urlObj = new URL(file.file_url);
    const pathParts = urlObj.pathname.split('/');
    const publicIndex = pathParts.indexOf('public');
    
    if (publicIndex !== -1 && pathParts.length > publicIndex + 1) {
      bucket = pathParts[publicIndex + 1];
      filePath = pathParts.slice(publicIndex + 2).join('/');
    }
  } else {
    // Chemin relatif
    const fullPath = file.file_url.replace(/^public\//, '');
    const pathParts = fullPath.split('/');
    bucket = pathParts[0] || 'attachments';
    filePath = pathParts.slice(1).join('/');
  }
  
  // Créer URL signée sans forcer le téléchargement
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600, { download: false });
  
  if (error || !data?.signedUrl) return null;
  
  // Nettoyer l'URL (supprimer param download)
  const url = new URL(data.signedUrl);
  url.searchParams.delete('download');
  return url.toString();
};
```

#### 2. Détection du type de fichier et conversion automatique

```javascript
// Détection robuste de l'extension
const rawName = (file.file_name || '').trim();
const cleanedName = rawName.replace(/[\)\]\}]+\s*$/g, '');
const lastDotIndex = cleanedName.lastIndexOf('.');
let fileExtension = '';

if (lastDotIndex > 0) {
  const rawExtension = cleanedName.substring(lastDotIndex + 1);
  fileExtension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

const isWordDoc = ['doc', 'docx'].includes(fileExtension);
const isPdf = fileExtension === 'pdf';

if (isWordDoc) {
  // Conversion Word → PDF automatique
  const { getConvertedPdfUrl } = await import('@/lib/uploadManager');
  previewPdfUrl = await getConvertedPdfUrl(file);
}
```

#### 3. Visualisation via PdfViewer intégré

```javascript
if (previewPdfUrl) {
  setPreviewFile(file);
  setPreviewUrl(previewPdfUrl);
}

// Composant PdfViewer
<PdfViewer
  fileUrl={previewUrl}
  fileName={previewFile.file_name}
  onClose={() => {
    setPreviewUrl(null);
    setPreviewFile(null);
  }}
  onDownload={() => downloadFile(previewFile)}
/>
```

#### 4. Téléchargement sans modification d'extension

```javascript
// Import depuis filePreviewUtils
import { downloadFile, hasLocalBackup } from '@/lib/filePreviewUtils';

// Utilisation directe
<button onClick={() => downloadFile(file)}>
  <Download className="w-4 h-4" />
</button>
```

**Fonction `downloadFile` dans `filePreviewUtils.js` :**

- Télécharge via `downloadFileWithCors()` pour les URLs publiques
- Conserve le nom original du fichier
- Applique uniquement le nettoyage lors du téléchargement (suppression parenthèses parasites)
- Gère les backups locaux si disponibles

---

## 🎯 Zones concernées par l'unification

### 1. TaskCard.jsx

**Localisation :** `src/components/TaskCard.jsx`

#### Méthode actuelle

```javascript
const handleDownload = async (filePath) => {
  const { data, error } = await supabase.storage
    .from('attachments')
    .download(filePath);
  
  if (error) return;
  
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  const cleanedName = cleanFileNameForDownload(originalFileName);
  a.download = cleanedName;
  a.click();
  URL.revokeObjectURL(url);
}

const handlePrint = async (filePath) => {
  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);
  
  if (data.publicUrl) {
    const printWindow = window.open(data.publicUrl, '_blank');
    printWindow.onload = () => printWindow.print();
  }
}
```

#### Affichage actuel

```jsx
<button
  onClick={() => handleDownload(path)}
  title="Télécharger la pièce jointe"
>
  <Download className="w-3 h-3" />
</button>
```

#### Problèmes identifiés

- ❌ Pas de prévisualisation interactive (juste téléchargement)
- ❌ Utilise `download()` de Supabase (différent de TaskManager)
- ❌ Impression via `window.open()` sans contrôle
- ❌ Pas de support de conversion Word → PDF
- ❌ Pas d'utilisation du composant PdfViewer

#### Modifications requises

1. **Ajouter un état de prévisualisation**
   ```javascript
   const [previewFile, setPreviewFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   ```

2. **Intégrer la fonction `createPreviewUrl`**
   - Copier depuis TaskManager.jsx
   - Adapter pour les chemins de fichiers de TaskCard

3. **Ajouter un bouton "Prévisualiser"**
   ```jsx
   <button
     onClick={async () => {
       const previewPdfUrl = await createPreviewUrl(file);
       if (previewPdfUrl) {
         setPreviewFile(file);
         setPreviewUrl(previewPdfUrl);
       }
     }}
   >
     Prévisualiser
   </button>
   ```

4. **Utiliser `downloadFile` depuis filePreviewUtils**
   ```javascript
   import { downloadFile } from '@/lib/filePreviewUtils';
   
   <button onClick={() => downloadFile(file)}>
     <Download />
   </button>
   ```

5. **Intégrer PdfViewer**
   ```jsx
   {previewUrl && previewFile && (
     <PdfViewer
       fileUrl={previewUrl}
       fileName={previewFile.file_name}
       onClose={() => {
         setPreviewUrl(null);
         setPreviewFile(null);
       }}
       onDownload={() => downloadFile(previewFile)}
     />
   )}
   ```

---

### 2. DocumentManager.jsx

**Localisation :** `src/components/DocumentManager.jsx`

#### Méthode actuelle

```javascript
const handleDownload = async (url, name) => {
  const blob = await downloadFileWithCors(url);
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const cleanedName = cleanFileNameForDownload(name);
  a.download = cleanedName;
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
}

const handlePreview = (url) => {
  const previewUrl = url.includes('?') 
    ? `${url}&download=` 
    : `${url}?download=`;
  window.open(previewUrl, '_blank', 'noopener,noreferrer');
}
```

#### Affichage actuel

```jsx
<Button onClick={() => handlePreview(doc.url)}>
  <Eye className="w-4 h-4" />
</Button>
<Button onClick={() => handleDownload(doc.url, doc.name)}>
  <Download className="w-4 h-4" />
</Button>
```

#### Problèmes identifiés

- ❌ Prévisualisation via `window.open()` (aucun contrôle)
- ❌ Pas d'utilisation du composant PdfViewer
- ❌ Pas de support de conversion Word → PDF
- ❌ Téléchargement manuel avec `downloadFileWithCors()` au lieu d'utiliser le service unifié

#### Modifications requises

1. **Ajouter un état de prévisualisation**
   ```javascript
   const [previewFile, setPreviewFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   ```

2. **Créer une fonction `createPreviewUrl` locale**
   - Reprendre la logique de TaskManager.jsx
   - Adapter pour les objets `doc` de DocumentManager

3. **Remplacer `handlePreview` par prévisualisation intégrée**
   ```javascript
   const handlePreview = async (doc) => {
     try {
       const rawName = (doc.name || '').trim();
       const cleanedName = rawName.replace(/[\)\]\}]+\s*$/g, '');
       const lastDotIndex = cleanedName.lastIndexOf('.');
       let fileExtension = '';
       
       if (lastDotIndex > 0) {
         const rawExtension = cleanedName.substring(lastDotIndex + 1);
         fileExtension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
       }
       
       const isWordDoc = ['doc', 'docx'].includes(fileExtension);
       const isPdf = fileExtension === 'pdf';
       
       let previewPdfUrl = null;
       
       if (isPdf) {
         previewPdfUrl = await createPreviewUrl(doc);
       } else if (isWordDoc) {
         const { getConvertedPdfUrl } = await import('@/lib/uploadManager');
         previewPdfUrl = await getConvertedPdfUrl(doc);
       } else {
         toast({
           variant: 'destructive',
           title: 'Format non supporté',
           description: 'Seuls les fichiers PDF et Word peuvent être prévisualisés.',
         });
         return;
       }
       
       if (previewPdfUrl) {
         setPreviewFile(doc);
         setPreviewUrl(previewPdfUrl);
       }
     } catch (error) {
       console.error('Erreur prévisualisation:', error);
       toast({
         variant: 'destructive',
         title: 'Erreur',
         description: 'Impossible d\'ouvrir le fichier en prévisualisation',
       });
     }
   };
   ```

4. **Remplacer `handleDownload` par le service unifié**
   ```javascript
   import { downloadFile } from '@/lib/filePreviewUtils';
   
   <Button onClick={() => downloadFile(doc)}>
     <Download className="w-4 h-4" />
   </Button>
   ```

5. **Intégrer PdfViewer**
   ```jsx
   {previewUrl && previewFile && (
     <PdfViewer
       fileUrl={previewUrl}
       fileName={previewFile.name}
       onClose={() => {
         setPreviewUrl(null);
         setPreviewFile(null);
       }}
       onDownload={() => downloadFile(previewFile)}
     />
   )}
   ```

---

## 🏗️ Architecture proposée

### Service centralisé : `previewService.js`

**Localisation :** `src/lib/previewService.js` (à créer)

Ce service exposera toutes les fonctions nécessaires pour la prévisualisation unifiée :

```javascript
// src/lib/previewService.js
import { supabase } from '@/lib/customSupabaseClient';
import { downloadFile as downloadFileUtil } from '@/lib/filePreviewUtils';

/**
 * Crée une URL signée pour prévisualisation sans forcer le téléchargement
 * @param {Object} file - Objet fichier avec file_url
 * @returns {Promise<string|null>} - URL signée nettoyée
 */
export async function createPreviewUrl(file) {
  try {
    if (!file || !file.file_url) return null;

    let bucket = 'attachments';
    let filePath = '';

    if (file.file_url.startsWith('http')) {
      const urlObj = new URL(file.file_url);
      const pathParts = urlObj.pathname.split('/');
      const publicIndex = pathParts.indexOf('public');
      
      if (publicIndex !== -1 && pathParts.length > publicIndex + 1) {
        bucket = pathParts[publicIndex + 1];
        filePath = pathParts.slice(publicIndex + 2).join('/');
      } else {
        console.error('Format d\'URL non reconnu:', file.file_url);
        return null;
      }
    } else {
      const fullPath = file.file_url.replace(/^public\//, '');
      const pathParts = fullPath.split('/');
      bucket = pathParts[0] || 'attachments';
      filePath = pathParts.slice(1).join('/');
    }

    if (!filePath) {
      console.error('Impossible d\'extraire le chemin du fichier');
      return null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600, { download: false });

    if (error || !data?.signedUrl) {
      console.error('Erreur création URL signée:', error);
      return null;
    }

    const url = new URL(data.signedUrl);
    url.searchParams.delete('download');
    return url.toString();

  } catch (e) {
    console.error('Erreur createPreviewUrl:', e);
    return null;
  }
}

/**
 * Détecte l'extension d'un fichier de manière robuste
 * @param {string} fileName - Nom du fichier
 * @returns {string} - Extension en minuscules
 */
export function getFileExtension(fileName) {
  if (!fileName) return '';
  
  const rawName = fileName.trim();
  const cleanedName = rawName.replace(/[\)\]\}]+\s*$/g, '');
  const lastDotIndex = cleanedName.lastIndexOf('.');
  
  if (lastDotIndex <= 0) return '';
  
  const rawExtension = cleanedName.substring(lastDotIndex + 1);
  return rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/**
 * Prépare un fichier pour prévisualisation (PDF ou Word converti)
 * @param {Object} file - Objet fichier
 * @returns {Promise<Object>} - { url: string, needsConversion: boolean }
 */
export async function prepareFileForPreview(file) {
  const extension = getFileExtension(file.file_name || file.name);
  const isWordDoc = ['doc', 'docx'].includes(extension);
  const isPdf = extension === 'pdf';
  
  if (!isPdf && !isWordDoc) {
    return { 
      url: null, 
      error: 'Format non supporté. Seuls les PDF et Word sont prévisualisables.' 
    };
  }
  
  if (isPdf) {
    const url = await createPreviewUrl(file);
    return { url, needsConversion: false };
  }
  
  if (isWordDoc) {
    const { getConvertedPdfUrl } = await import('@/lib/uploadManager');
    const url = await getConvertedPdfUrl(file);
    return { url, needsConversion: true };
  }
  
  return { url: null, error: 'Type de fichier non reconnu' };
}

/**
 * Télécharge un fichier (wrapper vers filePreviewUtils)
 * @param {Object} file - Objet fichier
 */
export async function downloadFile(file) {
  return downloadFileUtil(file);
}

/**
 * Hook React pour gérer la prévisualisation
 * Retourne les états et fonctions nécessaires
 */
export function useFilePreview() {
  const [previewFile, setPreviewFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const openPreview = async (file) => {
    setIsLoading(true);
    try {
      const { url, error } = await prepareFileForPreview(file);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error,
        });
        return;
      }
      
      if (url) {
        setPreviewFile(file);
        setPreviewUrl(url);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de générer l\'URL de prévisualisation',
        });
      }
    } catch (error) {
      console.error('Erreur prévisualisation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ouvrir le fichier',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewFile(null);
  };
  
  return {
    previewFile,
    previewUrl,
    isLoading,
    openPreview,
    closePreview,
  };
}
```

### Structure des fichiers après unification

```
src/
├── lib/
│   ├── previewService.js          ← NOUVEAU service centralisé
│   ├── filePreviewUtils.js        ← Existant (téléchargement)
│   ├── uploadManager.js           ← Existant (upload + conversion)
│   └── wordToPdfConverter.js      ← Existant (conversion Word)
│
├── components/
│   ├── PdfViewer.jsx              ← Existant (visualiseur unifié)
│   ├── TaskManager.jsx            ✅ Déjà conforme (référence)
│   ├── TaskCard.jsx               🔄 À modifier
│   └── DocumentManager.jsx        🔄 À modifier
```

---

## 📝 Plan d'implémentation

### Phase 1 : Création du service centralisé

**Durée estimée :** 1h

1. **Créer `src/lib/previewService.js`**
   - Extraire `createPreviewUrl` de TaskManager.jsx
   - Ajouter `getFileExtension` (détection robuste)
   - Ajouter `prepareFileForPreview` (gestion PDF + Word)
   - Créer le hook `useFilePreview` pour React

2. **Tests unitaires**
   - Tester `getFileExtension` avec différents formats de noms
   - Vérifier `createPreviewUrl` avec URLs complètes et relatives
   - Valider `prepareFileForPreview` avec PDF et Word

---

### Phase 2 : Migration de TaskCard.jsx

**Durée estimée :** 2h

1. **Imports**
   ```javascript
   import { useFilePreview, downloadFile } from '@/lib/previewService';
   import PdfViewer from '@/components/PdfViewer';
   ```

2. **Ajouter le hook dans le composant**
   ```javascript
   const { previewFile, previewUrl, isLoading, openPreview, closePreview } = useFilePreview();
   ```

3. **Remplacer `handleDownload` par `downloadFile`**

4. **Supprimer `handlePrint` (remplacé par prévisualisation)**

5. **Ajouter bouton "Prévisualiser"**
   ```jsx
   <button
     onClick={() => openPreview(file)}
     disabled={isLoading}
   >
     {isLoading ? 'Chargement...' : 'Prévisualiser'}
   </button>
   ```

6. **Intégrer PdfViewer**
   ```jsx
   {previewUrl && previewFile && (
     <PdfViewer
       fileUrl={previewUrl}
       fileName={previewFile.file_name}
       onClose={closePreview}
       onDownload={() => downloadFile(previewFile)}
     />
   )}
   ```

7. **Tests**
   - Vérifier prévisualisation PDF
   - Vérifier conversion Word → PDF
   - Vérifier téléchargement
   - Tester avec fichiers contenant parenthèses

---

### Phase 3 : Migration de DocumentManager.jsx

**Durée estimée :** 2h

1. **Imports**
   ```javascript
   import { useFilePreview, downloadFile } from '@/lib/previewService';
   import PdfViewer from '@/components/PdfViewer';
   ```

2. **Ajouter le hook**
   ```javascript
   const { previewFile, previewUrl, isLoading, openPreview, closePreview } = useFilePreview();
   ```

3. **Remplacer `handleDownload`**
   ```javascript
   // Supprimer la fonction handleDownload existante
   // Utiliser directement downloadFile du service
   ```

4. **Remplacer `handlePreview`**
   ```javascript
   // Supprimer handlePreview existant
   // Utiliser openPreview du hook
   ```

5. **Mettre à jour les boutons**
   ```jsx
   <Button onClick={() => openPreview(doc)}>
     <Eye className="w-4 h-4" />
   </Button>
   <Button onClick={() => downloadFile(doc)}>
     <Download className="w-4 h-4" />
   </Button>
   ```

6. **Intégrer PdfViewer**

7. **Tests**
   - Prévisualisation depuis liste des documents
   - Téléchargement correct
   - Gestion des erreurs

---

### Phase 4 : Refactoring de TaskManager.jsx

**Durée estimée :** 1h

1. **Remplacer la fonction locale `createPreviewUrl` par l'import**
   ```javascript
   import { createPreviewUrl, prepareFileForPreview, downloadFile } from '@/lib/previewService';
   ```

2. **Simplifier la logique de prévisualisation**
   - Utiliser `prepareFileForPreview` au lieu du code inline

3. **Vérifier la cohérence**

4. **Tests de non-régression**

---

### Phase 5 : Documentation et tests finaux

**Durée estimée :** 1h

1. **Documenter le service `previewService.js`**
   - JSDoc complet
   - Exemples d'utilisation

2. **Mettre à jour le README**
   - Section "Prévisualisation des documents"
   - Guide d'utilisation pour les développeurs

3. **Tests end-to-end**
   - Parcours complet : upload → prévisualisation → téléchargement
   - Vérifier TaskManager, TaskCard, DocumentManager
   - Tester avec différents formats de fichiers

4. **Validation finale**
   - Aucune régression sur l'UX existante
   - Cohérence sur tous les composants

---

## ⚠️ Contraintes et prérequis

### ✅ À respecter absolument

1. **Ne pas toucher au système d'upload**
   - `uploadManager.js` ne doit pas être modifié (sauf ajout d'exports si nécessaire)
   - Le processus de conversion Word → PDF reste inchangé
   - L'optimisation PDF reste active

2. **Ne jamais renommer les fichiers au téléchargement**
   - Le fichier conserve son nom original dans Supabase Storage
   - Le nettoyage du nom (suppression parenthèses) s'applique **uniquement** lors du téléchargement côté client
   - Fonction `cleanFileNameForDownload` dans `filePreviewUtils.js` reste inchangée

3. **Ne jamais forcer le téléchargement lors d'un clic sur "Prévisualiser"**
   - `createSignedUrl` avec `{ download: false }`
   - Supprimer le paramètre `?download=` de l'URL

4. **Conserver l'UX existante**
   - Même flow utilisateur
   - Même vitesse de réponse
   - Pas de changement visuel majeur

5. **Gestion des caractères spéciaux**
   - Noms avec parenthèses : `document(1).pdf`
   - Noms avec espaces : `rapport final.docx`
   - Extensions multiples : `fichier.pdf.docx)`

### 🚫 À éviter

- ❌ Ajouter de nouvelles dépendances npm
- ❌ Modifier le schéma de la base de données
- ❌ Changer la structure des URLs Supabase Storage
- ❌ Créer des doublons de logique (tout doit passer par `previewService`)
- ❌ Toucher aux composants Print (hors périmètre)

### 📦 Dépendances existantes à utiliser

- `supabase` - Client Supabase (Storage, Auth)
- `@/lib/filePreviewUtils` - Téléchargement et nettoyage de noms
- `@/lib/uploadManager` - Upload et conversion Word → PDF
- `@/lib/wordToPdfConverter` - Service de conversion
- `@/components/PdfViewer` - Visualiseur PDF.js intégré

---

## 🎯 Résultats attendus

### Avant l'unification

| Composant | Prévisualisation | Téléchargement | Conversion Word | Cohérence |
|-----------|------------------|----------------|-----------------|-----------|
| TaskManager | ✅ PdfViewer | ✅ Service unifié | ✅ Automatique | ✅ |
| TaskCard | ❌ Aucune | ⚠️ Supabase.download() | ❌ Aucune | ❌ |
| DocumentManager | ⚠️ window.open() | ⚠️ downloadFileWithCors | ❌ Aucune | ❌ |

### Après l'unification

| Composant | Prévisualisation | Téléchargement | Conversion Word | Cohérence |
|-----------|------------------|----------------|-----------------|-----------|
| TaskManager | ✅ PdfViewer | ✅ Service unifié | ✅ Automatique | ✅ |
| TaskCard | ✅ PdfViewer | ✅ Service unifié | ✅ Automatique | ✅ |
| DocumentManager | ✅ PdfViewer | ✅ Service unifié | ✅ Automatique | ✅ |

### Bénéfices de l'unification

1. **Cohérence totale**
   - Même expérience utilisateur partout
   - Même comportement de prévisualisation
   - Même gestion des erreurs

2. **Maintenabilité**
   - Un seul point de modification (previewService)
   - Réutilisation du code
   - Tests centralisés

3. **Fonctionnalités uniformes**
   - Conversion Word → PDF partout
   - Support des noms de fichiers complexes partout
   - Gestion CORS identique partout

4. **Prévention des régressions**
   - Tout changement futur dans `previewService` se propage automatiquement
   - Impossible d'avoir des comportements divergents

---

## 📌 Points de vigilance

### Gestion des erreurs

Chaque composant doit gérer les erreurs suivantes :

- Fichier introuvable (404)
- Format non supporté
- Échec de conversion Word → PDF
- Erreur réseau (CORS, timeout)
- Blob vide lors du téléchargement

### Performance

- Les URLs signées ont une durée de vie de 3600 secondes (1h)
- La conversion Word → PDF peut prendre quelques secondes (afficher un loader)
- L'optimisation PDF peut augmenter légèrement le temps d'upload

### Compatibilité

- ✅ Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive
- ✅ PDF.js via CDN (pas d'installation locale)

---

## 🚀 Instructions d'intégration finale

### Pour intégrer le système unifié dans un nouveau composant :

1. **Importer le service**
   ```javascript
   import { useFilePreview, downloadFile } from '@/lib/previewService';
   import PdfViewer from '@/components/PdfViewer';
   ```

2. **Ajouter le hook**
   ```javascript
   const { previewFile, previewUrl, isLoading, openPreview, closePreview } = useFilePreview();
   ```

3. **Boutons d'action**
   ```jsx
   <button onClick={() => openPreview(file)} disabled={isLoading}>
     {isLoading ? 'Chargement...' : 'Prévisualiser'}
   </button>
   <button onClick={() => downloadFile(file)}>
     Télécharger
   </button>
   ```

4. **Intégrer le visualiseur**
   ```jsx
   {previewUrl && previewFile && (
     <PdfViewer
       fileUrl={previewUrl}
       fileName={previewFile.file_name || previewFile.name}
       onClose={closePreview}
       onDownload={() => downloadFile(previewFile)}
     />
   )}
   ```

5. **C'est tout !**

---

## 📊 Récapitulatif

| Élément | État | Action |
|---------|------|--------|
| `previewService.js` | 🆕 À créer | Service centralisé |
| `TaskManager.jsx` | ✅ Référence | Refactoring mineur |
| `TaskCard.jsx` | 🔄 À modifier | Migration complète |
| `DocumentManager.jsx` | 🔄 À modifier | Migration complète |
| `PdfViewer.jsx` | ✅ Existant | Aucune modification |
| `filePreviewUtils.js` | ✅ Existant | Aucune modification |
| `uploadManager.js` | ✅ Existant | Aucune modification |

**Durée totale estimée :** 7 heures  
**Complexité :** Moyenne  
**Impact :** Élevé (amélioration significative de la cohérence)

---

## ✅ Checklist finale

Avant de considérer l'unification comme terminée :

- [ ] `previewService.js` créé et documenté
- [ ] Tests unitaires du service passent
- [ ] TaskCard.jsx migré et testé
- [ ] DocumentManager.jsx migré et testé
- [ ] TaskManager.jsx refactoré
- [ ] Aucune régression détectée
- [ ] Documentation mise à jour
- [ ] Tests end-to-end validés
- [ ] Code review effectué
- [ ] Déploiement en staging réussi

---

**Document généré le :** 28 novembre 2025  
**Projet :** Gestion-Cab  
**Objectif :** Unification de la prévisualisation des documents  
**Périmètre :** Frontend uniquement (pas de modification backend)
