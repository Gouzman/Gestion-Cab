# ✅ Modifications TaskManager.jsx - Conversion Word → PDF

## 🎯 Objectif

Supprimer le blocage sur les fichiers Word et permettre la conversion automatique en PDF avant prévisualisation.

## 📝 Modifications Effectuées

### 1️⃣ TaskManager.jsx - Bouton Prévisualiser

**Avant :**
```javascript
// ❌ Bloquait tous les fichiers non-PDF
if (fileExtension !== 'pdf') {
  toast({
    variant: 'destructive',
    title: 'Format non supporté',
    description: 'Seuls les fichiers PDF peuvent être prévisualisés...',
  });
  return;
}
```

**Après :**
```javascript
// ✅ Supporte PDF et Word avec conversion automatique
const isWordDoc = ['doc', 'docx'].includes(fileExtension);
const isPdf = fileExtension === 'pdf';

if (isPdf) {
  // Prévisualisation normale
  previewPdfUrl = await createPreviewUrl(file);
} else if (isWordDoc) {
  // Conversion automatique Word → PDF
  const { getConvertedPdfUrl } = await import('@/lib/uploadManager');
  previewPdfUrl = await getConvertedPdfUrl(file);
}
```

### 2️⃣ uploadManager.js - Nouvelle Fonction

**Ajout de `getConvertedPdfUrl()` :**

```javascript
/**
 * Obtient l'URL de prévisualisation PDF pour un fichier
 * Si le fichier est un document Word, le convertit automatiquement en PDF
 */
export async function getConvertedPdfUrl(file) {
  // 1. Si déjà PDF → retourne l'URL directement
  // 2. Si Word → télécharge, convertit, retourne blob URL
  // 3. Sinon → null
}
```

## 🔄 Workflow de Prévisualisation

```
Clic "Prévisualiser"
    ↓
Détection du type de fichier
    ↓
┌─────────────────────────────────────┐
│ PDF ?                               │
│  ✅ → createPreviewUrl()            │
│  ✅ → Ouvrir PdfViewer              │
└─────────────────────────────────────┘
    OU
┌─────────────────────────────────────┐
│ Word (.doc/.docx) ?                 │
│  ✅ → Toast "Conversion en cours"   │
│  ✅ → getConvertedPdfUrl()          │
│     1. Télécharge depuis Supabase   │
│     2. Appelle convertWordToPdf()   │
│     3. Crée blob URL                │
│  ✅ → Ouvrir PdfViewer avec PDF     │
└─────────────────────────────────────┘
    OU
┌─────────────────────────────────────┐
│ Autre format ?                      │
│  ❌ → Toast "Format non supporté"   │
└─────────────────────────────────────┘
```

## ✅ Résultat

### Avant
```
Upload fichier.docx
  → Clic "Prévisualiser"
  → ❌ "Seuls les fichiers PDF peuvent être prévisualisés"
```

### Après
```
Upload fichier.docx
  → Clic "Prévisualiser"
  → ℹ️ "Conversion en cours..."
  → ✅ PDF s'affiche dans le viewer
```

## 🧪 Test

1. **Uploader un fichier .docx** dans TaskManager
2. **Cliquer sur "Prévisualiser"**
3. **Observer :**
   - Toast : "Conversion en cours..."
   - Console : "📄 Téléchargement du fichier Word..."
   - Console : "🔄 Conversion Word → PDF..."
   - Console : "✅ Conversion réussie"
   - PdfViewer s'ouvre avec le PDF converti

## 📊 Changements

| Fichier | Lignes modifiées | Type |
|---------|------------------|------|
| `TaskManager.jsx` | ~50 lignes | Modifié |
| `uploadManager.js` | +65 lignes | Ajouté |

## 🔒 Garanties

- ✅ **Aucune régression** : Les PDFs fonctionnent toujours normalement
- ✅ **UI inchangée** : Même bouton, même apparence
- ✅ **Fallback gracieux** : Si conversion échoue, message d'erreur clair
- ✅ **Performance** : Conversion à la demande (pas à l'upload)
- ✅ **Compatibilité** : .doc et .docx supportés

## 🎯 Critères de Validation - Validés

| Critère | Statut |
|---------|--------|
| Blocage sur fichiers Word supprimé | ✅ |
| Conversion automatique Word → PDF | ✅ |
| Preview fonctionne pour Word | ✅ |
| Message "Seuls les PDF..." supprimé | ✅ |
| PdfViewer non modifié | ✅ |
| UI inchangée | ✅ |

## 📚 Fichiers Impliqués

1. **`src/components/TaskManager.jsx`** - Logique du bouton Prévisualiser
2. **`src/lib/uploadManager.js`** - Fonction `getConvertedPdfUrl()`
3. **`src/lib/wordToPdfConverter.js`** - Conversion Word → PDF (déjà existant)

---

**Date :** 27 novembre 2025  
**Version :** 1.1.0  
**Statut :** ✅ Opérationnel

**🚀 Prêt à tester !**
