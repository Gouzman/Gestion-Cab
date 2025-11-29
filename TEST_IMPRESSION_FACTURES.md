# 🧪 Guide Test : Impression Factures Optimisées

## ⚡ Test Rapide (2 minutes)

### 1. Tester Facture Individuelle

```bash
# 1. Ouvrir l'application
npm run dev

# 2. Naviguer vers Facturation
# 3. Créer ou ouvrir une facture existante
# 4. Cliquer sur "Aperçu d'impression"
# 5. Cliquer sur "Imprimer" (ou Cmd+P / Ctrl+P)
```

**✅ Vérifications visuelles** :
- [ ] Toute la facture tient sur 1 page (contenu court)
- [ ] En-tête cabinet visible et complet
- [ ] Tableau prestations non coupé
- [ ] Bloc totaux (TOTAL DÛ) entièrement visible
- [ ] Mentions légales + signature visibles
- [ ] Pas de débordement horizontal
- [ ] Couleurs préservées (bande violette, badges)

### 2. Tester Rapport Multi-factures

```bash
# 1. Dans Facturation, sélectionner plusieurs factures
# 2. Cliquer sur "Imprimer le rapport"
# 3. Vérifier aperçu impression
```

**✅ Vérifications** :
- [ ] Statistiques (4 cartes) non coupées
- [ ] Tableau : lignes entières (pas de coupure au milieu)
- [ ] Noms clients lisibles (tronqués si longs)
- [ ] Résumé financier complet en bas

## 🎨 Cas de Test Spécifiques

### Test 1 : Facture Courte (3 prestations)
**Attendu** : 1 page A4 complète

```javascript
// Exemple de facture courte
{
  honoraires: {
    forfait: 50000,
    tauxHoraire: 0,
    base: 0,
    resultat: 0
  },
  debours: {
    entrevue: 5000,
    huissier: 10000
  }
  // Total : 3 lignes dans le tableau
}
```

### Test 2 : Facture Longue (10 prestations)
**Attendu** : 1-2 pages maximum

```javascript
// Toutes les prestations remplies
{
  honoraires: {
    forfait: 100000,
    tauxHoraire: 50000,
    base: 30000,
    resultat: 20000
  },
  debours: {
    entrevue: 5000,
    dossier: 8000,
    plaidoirie: 15000,
    huissier: 10000,
    deplacement: 7000
  }
  // Total : 9 lignes
}
```

### Test 3 : Rapport 20 Factures
**Attendu** : 2 pages avec rupture propre

## 🖨️ Test Export PDF

### Chrome/Edge
```bash
# 1. Ouvrir aperçu impression (Cmd+P / Ctrl+P)
# 2. Destination : "Enregistrer au format PDF"
# 3. Cliquer "Enregistrer"
# 4. Ouvrir le PDF généré
```

**✅ Vérifier** :
- [ ] Format A4 respecté
- [ ] Couleurs correctes
- [ ] Texte sélectionnable (pas image)
- [ ] Liens cliquables (si présents)

### Firefox
```bash
# 1. Aperçu impression
# 2. Imprimante : "Microsoft Print to PDF" ou "Enregistrer en PDF"
# 3. Options : 
#    - Échelle : 100%
#    - Marges : Par défaut
# 4. Imprimer
```

## 🔍 Inspection Technique

### DevTools Check (Chrome)
```javascript
// 1. Ouvrir DevTools (F12)
// 2. Console, exécuter :

// Tester classes print
document.querySelector('.print\\:p-\\[12mm\\]')

// Vérifier @page
const sheets = document.styleSheets;
for (let sheet of sheets) {
  for (let rule of sheet.cssRules || []) {
    if (rule.cssText.includes('@page')) {
      console.log(rule.cssText);
    }
  }
}

// Résultat attendu :
// @page { margin: 10mm 12mm; size: A4 portrait; }
```

### Émulation Print Media
```bash
# 1. DevTools > Rendering (Cmd+Shift+P → "Show Rendering")
# 2. Emulate CSS media type : print
# 3. Vérifier que les classes print: s'appliquent
```

## 📊 Mesures de Performance

### Temps de Rendu
- **Facture simple** : < 100ms
- **Rapport 50 factures** : < 500ms

### Taille PDF
- **Facture 1 page** : ~50-80 KB
- **Rapport 2 pages** : ~100-150 KB

## ⚠️ Problèmes Connus & Solutions

### Problème 1 : Coupure Malgré page-break-inside
**Cause** : Contenu trop haut pour page restante
**Solution** : Forcer `page-break-before: always` sur section suivante

### Problème 2 : Couleurs Grisées
**Cause** : Option "Imprimer arrière-plans" désactivée
**Solution** : 
```bash
Chrome : Imprimer → Plus de paramètres → ✅ Graphiques en arrière-plan
Firefox : Imprimer → Options → ✅ Imprimer les arrière-plans
```

### Problème 3 : Marges Trop Grandes
**Cause** : Marges imprimante par défaut
**Solution** : 
```bash
Paramètres impression → Marges : Minimales
```

## 🎯 Checklist Finale

Avant de valider l'optimisation :

- [ ] ✅ Facture courte : 1 page
- [ ] ✅ Facture longue : max 2 pages
- [ ] ✅ Rapport : pagination propre
- [ ] ✅ Export PDF fonctionnel
- [ ] ✅ Couleurs préservées
- [ ] ✅ Texte lisible (min 7pt)
- [ ] ✅ Pas de débordement horizontal
- [ ] ✅ Totaux toujours visibles
- [ ] ✅ Mentions légales complètes

## 📸 Screenshots Attendus

### Aperçu Facture (1 page)
```
┌────────────────────────────────────┐
│ [Bande violette] CABINET D'AVOCATS │
│ Adresse | Contact                  │
├────────────────────────────────────┤
│ FACTURE         │ CLIENT           │
│ N°: FACT-001    │ Jean Dupont      │
│ Date: 29/11/25  │                  │
├────────────────────────────────────┤
│ DÉTAIL DES PRESTATIONS             │
│ ┌─────────────────┬──────────────┐ │
│ │ Description     │ Montant      │ │
│ │ Honoraires...   │ 50 000       │ │
│ └─────────────────┴──────────────┘ │
├────────────────────────────────────┤
│               TOTAL DÛ: 59 000 F   │
├────────────────────────────────────┤
│ CONDITIONS DE PAIEMENT             │
│ Coordonnées bancaires              │
│ Remerciements                      │
│ [Signature]                        │
└────────────────────────────────────┘
```

## 🚀 Commandes Utiles

```bash
# Lancer en dev
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Linter check
npm run lint
```

## 📞 Support

En cas de problème :
1. Vérifier console navigateur (F12)
2. Tester dans un autre navigateur
3. Vérifier fichiers modifiés :
   - `src/components/InvoicePrintView.jsx`
   - `src/components/BillingPrintPage.jsx`

---

✅ **Tests réussis le** : 29/11/2025
🎯 **Commit** : `098a592`
