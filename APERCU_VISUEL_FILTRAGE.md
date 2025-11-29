# 🎨 APERÇU VISUEL : FILTRAGE CATÉGORIES

## 📸 Rendu Final

### Menu Latéral des Catégories

```
╔═══════════════════════════════════════════════╗
║  📂 Catégories                                ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📄  Tous les documents         [142]   │ ║  ← ACTIF (bleu)
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Contrats                   [45]    │ ║  ← Inactif (gris)
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Factures                   [28]    │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Correspondance             [19]    │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Procédures                 [12]    │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Pièces d'identité          [8]     │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Attestations                [15]    │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ 📁  Autres                     [15]    │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

### État ACTIF (Catégorie sélectionnée)

```css
┌─────────────────────────────────────────┐
│ 📄  Tous les documents         [142]   │
└─────────────────────────────────────────┘
  ▲
  │ Style appliqué :
  ├─ Background : #2563eb (bleu-600)
  ├─ Texte : #ffffff (blanc)
  ├─ Font : semibold
  ├─ Ombre : shadow-lg shadow-blue-500/20
  └─ Badge : bg-white/20 text-white
```

### État INACTIF (Catégorie non sélectionnée)

```css
┌─────────────────────────────────────────┐
│ 📁  Contrats                   [45]    │
└─────────────────────────────────────────┘
  ▲
  │ Style appliqué :
  ├─ Background : transparent
  ├─ Texte : #cbd5e1 (slate-300)
  ├─ Hover : bg-slate-700/50 + text-white
  └─ Badge : bg-slate-700/50 text-slate-400
```

---

## 🎬 COMPORTEMENT INTERACTIF

### 1️⃣ Au clic sur "Contrats"

**AVANT** :
```
Liste complète : 142 documents
├─ 45 Contrats
├─ 28 Factures
├─ 19 Correspondance
└─ ...
```

**APRÈS** :
```
Liste filtrée : 45 documents
└─ 45 Contrats uniquement

Menu latéral :
  📄  Tous les documents         [142]    ← Désactivé
  📁  Contrats                   [45]     ← ACTIF (bleu)
  📁  Factures                   [28]
  ...
```

### 2️⃣ Recherche + Filtrage Combiné

**Scénario** :
- Catégorie active : "Contrats" (45 documents)
- Recherche : "SARL"

**Résultat** :
```
Liste filtrée : 3 documents
└─ Uniquement les contrats contenant "SARL"
   ├─ Contrat SARL Martin.pdf
   ├─ Contrat SARL Dupont.pdf
   └─ Contrat SARL Durand.pdf
```

### 3️⃣ Upload nouveau document

**Action** : Upload "Facture Client X.pdf" avec catégorie = "facture"

**Effet** :
```
Menu latéral MAJ automatique :
  📄  Tous les documents         [143]    ← +1
  📁  Contrats                   [45]
  📁  Factures                   [29]     ← +1
  ...
```

---

## 🎨 PALETTE DE COULEURS

### Catégorie Active
```
Background  : #2563eb (blue-600)
Text        : #ffffff (white)
Badge BG    : rgba(255,255,255,0.2) (white/20)
Badge Text  : #ffffff (white)
Shadow      : rgba(59,130,246,0.2) (blue-500/20)
```

### Catégorie Inactive
```
Background  : transparent
Text        : #cbd5e1 (slate-300)
Badge BG    : rgba(51,65,85,0.5) (slate-700/50)
Badge Text  : #94a3b8 (slate-400)
Hover BG    : rgba(51,65,85,0.5) (slate-700/50)
Hover Text  : #ffffff (white)
```

### Icônes
```
Active   : #ffffff (white)
Inactive : #94a3b8 (slate-400)
Size     : 16px × 16px (w-4 h-4)
```

---

## 📐 DIMENSIONS

### Bouton Catégorie
```
Width   : 100% (w-full)
Padding : 16px (px-4 py-3)
Gap     : 12px (gap-3)
Border  : 8px radius (rounded-lg)
```

### Badge Compteur
```
Padding : 8px horizontal, 4px vertical (px-2 py-1)
Font    : 12px (text-xs)
Border  : 9999px radius (rounded-full)
```

---

## 🎯 ZONES CLIQUABLES

```
┌─────────────────────────────────────────┐
│ [ZONE CLIQUABLE ENTIÈRE]               │
│                                         │
│ 📁  Contrats                   [45]    │
│ ▲                              ▲       │
│ │                              │       │
│ Icône + Label                Badge    │
│ (clic = filtre)          (info seule) │
└─────────────────────────────────────────┘
```

**Comportement** :
- Clic n'importe où sur le bouton → active le filtre
- Badge non cliquable séparément (partie intégrante)
- Transition fluide 200ms

---

## 🔄 TRANSITIONS

### Animation au clic
```css
transition-all duration-200

États :
  Normal  → Actif   : 200ms
  Actif   → Normal  : 200ms
  Normal  → Hover   : Instantané
  Hover   → Normal  : 200ms
```

### Propriétés animées
- `background-color`
- `color`
- `box-shadow`
- `font-weight`

---

## 📱 RESPONSIVE

### Desktop (≥1024px)
```
Grid : 4 colonnes (1 pour catégories, 3 pour documents)
Menu : Fixe à gauche
Largeur catégories : 25%
```

### Mobile (<1024px)
```
Grid : 1 colonne
Menu : Au-dessus de la liste
Catégories : Scroll horizontal possible
```

---

## 🧪 TEST VISUEL RAPIDE

### Ouvrir DevTools
```javascript
// Console → Vérifier compteurs
const counts = {
  all: documents.length,
  contrat: documents.filter(d => d.category === 'contrat').length,
  facture: documents.filter(d => d.category === 'facture').length,
  // ...
};
console.table(counts);
```

### Inspecter Élément
```html
<!-- Catégorie active -->
<button class="bg-blue-600 text-white shadow-lg ...">
  <div class="flex items-center gap-3">
    <svg class="w-4 h-4 text-white">...</svg>
    <span class="text-sm">Contrats</span>
  </div>
  <span class="bg-white/20 text-white font-semibold ...">45</span>
</button>
```

---

## 🎨 COMPARAISON AVANT/APRÈS

### AVANT
```
❌ Pas de compteur visible
❌ Pas de filtrage
❌ Icônes toutes identiques (FileArchive)
❌ Pas de mise en surbrillance
```

### APRÈS
```
✅ Compteur (XX) sur chaque catégorie
✅ Filtrage fonctionnel au clic
✅ Icônes différenciées (FileText vs Folder)
✅ Style actif bleu avec ombre
✅ Transitions fluides
✅ Performance optimisée (useMemo)
```

---

## 🚀 POUR TESTER

```bash
# 1. Lancer l'app
npm run dev

# 2. Ouvrir navigateur
open http://localhost:3002/

# 3. Aller sur Documents
# 4. Tester les interactions
```

---

🎉 **Résultat final : Interface moderne, intuitive et performante !**
