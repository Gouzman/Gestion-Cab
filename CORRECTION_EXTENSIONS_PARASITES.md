# Correction de la fonction de nettoyage des noms de fichiers au téléchargement

## 📋 Objectif

Corriger la fonction `cleanFileNameForDownload` pour supprimer les extensions parasites et garder uniquement la véritable extension du fichier lors du téléchargement.

## 🎯 Problème résolu

**Entrée problématique :**
```
1763030167069_BIBLE_CHAMPIONS_LEAGUE-CONCOURS_BIBLIQUE-MANCHE_ELIMINATOIRE_2025_normalized.pdf.docx)
```

**Sortie attendue :**
```
1763030167069_BIBLE_CHAMPIONS_LEAGUE-CONCOURS_BIBLIQUE-MANCHE_ELIMINATOIRE_2025_normalized.docx
```

## ✅ Solution implémentée

### Règles appliquées

1. **Retirer toute parenthèse fermante `)` en fin de nom**
2. **Supprimer toutes les extensions parasites AVANT la vraie extension**
   - Exemple : supprimer `.pdf` quand le fichier est `.docx`
3. **Détecter l'extension réelle** en prenant tout ce qu'il y a APRÈS le dernier `.`
4. **Reconstruire le nom propre** sans espaces supplémentaires

### Algorithme

```javascript
function cleanFileNameForDownload(fileName):
  1. Retirer la parenthèse fermante finale si présente
  2. Extraire la vraie extension (après le dernier point)
  3. Supprimer récursivement les extensions parasites du nom de base
  4. Reconstruire : baseName + vraie extension
```

## 📁 Fichiers modifiés

### 1. `/src/lib/filePreviewUtils.js`
Fonction principale utilisée par `triggerDownload()`.

### 2. `/src/components/DocumentManager.jsx`
Copie locale de la fonction pour le téléchargement de documents.

### 3. `/src/components/TaskCard.jsx`
Copie locale de la fonction pour le téléchargement depuis les tâches.

## 🧪 Tests de validation

**Fichier de test :** `test-extension-cleanup.js`

```bash
node test-extension-cleanup.js
```

### Résultats

✅ **14/14 tests réussis**

| Entrée | Sortie attendue | Résultat |
|--------|-----------------|----------|
| `test.pdf.docx)` | `test.docx` | ✅ |
| `rapport(final).pdf.docx` | `rapport(final).docx` | ✅ |
| `preuve(02).xlsx)` | `preuve(02).xlsx` | ✅ |
| `document.pdf.png.docx` | `document.docx` | ✅ |
| `fichier.doc.pdf.xlsx)` | `fichier.xlsx` | ✅ |
| `Facture (Client X).pdf` | `Facture (Client X).pdf` | ✅ |

## 📝 Extensions parasites supportées

La fonction détecte et supprime les extensions suivantes lorsqu'elles apparaissent avant la vraie extension :

```javascript
['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
 'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'zip', 
 'rar', 'csv', 'json', 'xml', 'html', 'htm']
```

## 🔒 Garanties

- ✅ **Ne change pas l'extension réelle** du fichier
- ✅ **Ne touche pas au blob**, fetch ou storage
- ✅ **Appliqué uniquement au moment du téléchargement**
- ✅ **Le fichier conserve son nom original** dans Supabase
- ✅ **Aucune modification du contenu** du fichier

## 🎬 Utilisation

La fonction est **automatiquement appliquée** lors du téléchargement dans :
- `DocumentManager` (téléchargement de documents)
- `TaskCard` (téléchargement de fichiers liés aux tâches)
- `triggerDownload()` (fonction utilitaire générale)

**Aucune action requise de la part de l'utilisateur.**

## 📊 Impact

- **Avant :** Les fichiers téléchargés avec extensions multiples ne s'ouvraient pas correctement
- **Après :** Les fichiers s'ouvrent immédiatement avec le bon programme associé
- **Stockage :** Aucun changement dans Supabase (les noms originaux sont préservés)

## 🏁 Statut

✅ **Correction appliquée et testée avec succès**

Date de correction : 28 novembre 2025
